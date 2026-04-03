import { RoomState, PlayerInfo, GamePhase } from '../app/types';

type RoomEventType = 
  | 'ROOM_CREATED'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_READY'
  | 'GAME_STARTED'
  | 'GAME_PAUSED'
  | 'GAME_RESUMED'
  | 'TURN_CHANGED'
  | 'CARD_PICKED'
  | 'GAME_ENDED'
  | 'ROOM_UPDATED';

type RoomEvent = {
  type: RoomEventType;
  roomId: string;
  payload?: any;
  timestamp: number;
  senderId: string;
};

type RoomListener = (event: RoomEvent) => void;

const STORAGE_PREFIX = 'karuta_room_';
const ROOMS_LIST_KEY = 'karuta_rooms_list';
const BROADCAST_CHANNEL_NAME = 'karuta_game_channel';
const GAME_ENDED_TIMEOUT = 5 * 60 * 1000;
const SINGLE_PLAYER_TIMEOUT = 10 * 60 * 1000;

class RoomSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, RoomListener[]> = new Map();
  private senderId: string;
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private initialized = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.senderId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    this.channel.onmessage = this.handleMessage.bind(this);
    this.setupStorageListener();
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRooms();
    }, 60000);
  }

  private cleanupExpiredRooms() {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    const roomsList = this.getRoomsList();
    const validRooms: RoomInfo[] = [];
    
    roomsList.forEach(roomInfo => {
      const room = this.getRoom(roomInfo.roomId);
      
      if (!room) {
        return;
      }
      
      if (room.gamePhase === GamePhase.GameEnd && room.gameEndedAt) {
        if (now - room.gameEndedAt > GAME_ENDED_TIMEOUT) {
          this.deleteRoom(room.roomId);
          return;
        }
      }
      
      if (room.players.length === 1 && room.createdAt) {
        if (now - room.createdAt > SINGLE_PLAYER_TIMEOUT) {
          this.deleteRoom(room.roomId);
          return;
        }
      }
      
      validRooms.push(roomInfo);
    });
    
    if (validRooms.length !== roomsList.length) {
      localStorage.setItem(ROOMS_LIST_KEY, JSON.stringify(validRooms));
    }
  }

  private setupStorageListener() {
    if (typeof window === 'undefined') return;
    
    this.storageListener = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
        const roomId = e.key.replace(STORAGE_PREFIX, '');
        this.notifyListeners(roomId, {
          type: 'ROOM_UPDATED',
          roomId,
          timestamp: Date.now(),
          senderId: 'storage',
        });
      }
    };
    window.addEventListener('storage', this.storageListener);
  }

  private handleMessage(event: MessageEvent) {
    const roomEvent: RoomEvent = event.data;
    if (roomEvent.senderId === this.senderId) return;
    this.notifyListeners(roomEvent.roomId, roomEvent);
  }

  private broadcast(event: RoomEvent) {
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }

  private notifyListeners(roomId: string, event: RoomEvent) {
    const listeners = this.listeners.get(roomId) || [];
    listeners.forEach(listener => listener(event));
  }

  subscribe(roomId: string, listener: RoomListener): () => void {
    this.init();
    
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, []);
    }
    this.listeners.get(roomId)!.push(listener);
    
    return () => {
      const listeners = this.listeners.get(roomId) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  createRoom(room: RoomState): void {
    this.init();
    
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(`${STORAGE_PREFIX}${room.roomId}`, JSON.stringify(room));
    this.updateRoomsList(room.roomId, {
      roomId: room.roomId,
      hostName: room.players[0]?.name || '未知',
      playerCount: room.players.length,
      phase: room.gamePhase,
      gameMode: room.gameMode,
      createdAt: room.createdAt || Date.now(),
    });
    this.broadcast({
      type: 'ROOM_CREATED',
      roomId: room.roomId,
      payload: room,
      timestamp: Date.now(),
      senderId: this.senderId,
    });
  }

  updateRoom(room: RoomState): void {
    this.init();
    
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(`${STORAGE_PREFIX}${room.roomId}`, JSON.stringify(room));
    
    const existingRoomInfo = this.getRoomsList().find(r => r.roomId === room.roomId);
    this.updateRoomsList(room.roomId, {
      roomId: room.roomId,
      hostName: room.players.find(p => p.isHost)?.name || '未知',
      playerCount: room.players.length,
      phase: room.gamePhase,
      gameMode: room.gameMode,
      createdAt: existingRoomInfo?.createdAt || room.createdAt || Date.now(),
    });
    this.broadcast({
      type: 'ROOM_UPDATED',
      roomId: room.roomId,
      payload: room,
      timestamp: Date.now(),
      senderId: this.senderId,
    });
  }

  getRoom(roomId: string): RoomState | null {
    if (typeof window === 'undefined') return null;
    
    const data = localStorage.getItem(`${STORAGE_PREFIX}${roomId}`);
    return data ? JSON.parse(data) : null;
  }

  joinRoom(roomId: string, player: PlayerInfo): RoomState | null {
    this.init();
    
    const room = this.getRoom(roomId);
    if (!room) return null;
    
    const updatedRoom: RoomState = {
      ...room,
      players: [...room.players, player],
    };
    
    this.updateRoom(updatedRoom);
    this.broadcast({
      type: 'PLAYER_JOINED',
      roomId,
      payload: { player },
      timestamp: Date.now(),
      senderId: this.senderId,
    });
    
    return updatedRoom;
  }

  leaveRoom(roomId: string, playerId: number): void {
    this.init();
    
    const room = this.getRoom(roomId);
    if (!room) return;
    
    const updatedRoom: RoomState = {
      ...room,
      players: room.players.filter(p => p.id !== playerId),
    };
    
    if (updatedRoom.players.length === 0) {
      this.deleteRoom(roomId);
    } else {
      this.updateRoom(updatedRoom);
    }
    
    this.broadcast({
      type: 'PLAYER_LEFT',
      roomId,
      payload: { playerId },
      timestamp: Date.now(),
      senderId: this.senderId,
    });
  }

  toggleReady(roomId: string, playerId: number): RoomState | null {
    this.init();
    
    const room = this.getRoom(roomId);
    if (!room) return null;
    
    const updatedRoom: RoomState = {
      ...room,
      players: room.players.map(p => 
        p.id === playerId ? { ...p, isReady: !p.isReady } : p
      ),
    };
    
    this.updateRoom(updatedRoom);
    this.broadcast({
      type: 'PLAYER_READY',
      roomId,
      payload: { playerId },
      timestamp: Date.now(),
      senderId: this.senderId,
    });
    
    return updatedRoom;
  }

  deleteRoom(roomId: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(`${STORAGE_PREFIX}${roomId}`);
    this.removeFromRoomsList(roomId);
    this.broadcast({
      type: 'ROOM_UPDATED',
      roomId,
      payload: { deleted: true },
      timestamp: Date.now(),
      senderId: this.senderId,
    });
  }

  private updateRoomsList(roomId: string, info: RoomInfo) {
    if (typeof window === 'undefined') return;
    
    const list = this.getRoomsList();
    const index = list.findIndex(r => r.roomId === roomId);
    if (index >= 0) {
      list[index] = info;
    } else {
      list.push(info);
    }
    localStorage.setItem(ROOMS_LIST_KEY, JSON.stringify(list));
  }

  private removeFromRoomsList(roomId: string) {
    if (typeof window === 'undefined') return;
    
    const list = this.getRoomsList().filter(r => r.roomId !== roomId);
    localStorage.setItem(ROOMS_LIST_KEY, JSON.stringify(list));
  }

  getRoomsList(): RoomInfo[] {
    if (typeof window === 'undefined') return [];
    
    const data = localStorage.getItem(ROOMS_LIST_KEY);
    return data ? JSON.parse(data) : [];
  }

  getSenderId(): string {
    return this.senderId;
  }

  destroy(): void {
    if (typeof window === 'undefined') return;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
    if (this.channel) {
      this.channel.close();
    }
  }
}

export type RoomInfo = {
  roomId: string;
  hostName: string;
  playerCount: number;
  phase: number;
  gameMode: number;
  createdAt: number;
};

export const roomSync = new RoomSyncService();
