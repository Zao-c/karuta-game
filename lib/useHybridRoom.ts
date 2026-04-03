import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { authService, AuthUser } from './authService';
import { roomService, RoomState, RoomInfo, PlayerInfo } from './roomService';
import { roomSync } from './roomSync';
import type { CharacterConfig } from '../app/types';

export type GameMode = 0 | 1 | 2;
export type GamePhase = 0 | 1 | 2;

export type LocalRoomState = {
  roomId: string;
  hostId: string | number;
  players: any[];
  gameMode: GameMode;
  gamePhase: GamePhase;
  currentCharacterId: string | null;
  currentQuote: string | null;
  turnStartTime: number | null;
  pickEvents: any[];
  deckRows: number;
  deckColumns: number;
  playbackSetting: {
    countdown: boolean;
    randomStartPosition: boolean;
    playbackDuration: number;
  };
  paused: boolean;
  pausedTimeRemaining: number;
  customCards: any[];
  deckType: 'anime2026' | 'custom';
  deckCards: any[];
  currentTurnPicks: any[];
  createdAt: number;
};

type HybridConfig = {
  useSupabase: boolean;
  supabaseConfigured: boolean;
};

function checkSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your_supabase_project_url' && key !== 'your_supabase_anon_key');
}

export function useHybridRoom() {
  const [config, setConfig] = useState<HybridConfig>({
    useSupabase: false,
    supabaseConfigured: false,
  });
  
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<(RoomInfo | { roomId: string; hostName: string; playerCount: number; phase: number })[]>([]);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | number | null>(null);

  useEffect(() => {
    const supabaseConfigured = checkSupabaseConfigured();
    setConfig({
      useSupabase: supabaseConfigured,
      supabaseConfigured,
    });

    if (supabaseConfigured) {
      const unsubscribe = authService.subscribe((authUser) => {
        setUser(authUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (config.useSupabase) {
        const roomList = await roomService.getRooms();
        setRooms(roomList);
      } else {
        const localRooms = roomSync.getRoomsList();
        setRooms(localRooms);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [config.useSupabase]);

  useEffect(() => {
    if (!currentRoom) return;

    if (config.useSupabase && 'id' in currentRoom) {
      const unsubscribe = roomService.subscribeToRoom((currentRoom as RoomState).id, (room) => {
        if (room) {
          setCurrentRoom(room);
        } else {
          setCurrentRoom(null);
        }
      });
      return () => unsubscribe();
    } else if ('roomId' in currentRoom) {
      const unsubscribe = roomSync.subscribe((currentRoom as LocalRoomState).roomId, (event) => {
        if (event.type === 'ROOM_UPDATED' || event.type === 'PLAYER_JOINED' || event.type === 'PLAYER_READY') {
          if ((event.payload as any)?.deleted) {
            setCurrentRoom(null);
            return;
          }
          const updatedRoom = roomSync.getRoom((currentRoom as LocalRoomState).roomId) as any;
          if (updatedRoom) {
            setCurrentRoom(updatedRoom);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [currentRoom, config.useSupabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (config.useSupabase) {
      return authService.signIn(email, password);
    }
    return { success: false, error: 'Supabase not configured' };
  }, [config.useSupabase]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (config.useSupabase) {
      return authService.signUp(email, password, displayName);
    }
    return { success: false, error: 'Supabase not configured' };
  }, [config.useSupabase]);

  const signOut = useCallback(async () => {
    if (config.useSupabase) {
      await authService.signOut();
      setUser(null);
    }
    setCurrentRoom(null);
    setMyPlayerId(null);
  }, [config.useSupabase]);

  const createRoom = useCallback(async (playerName: string, deckType: 'anime2026' | 'custom' = 'anime2026', localRoomData?: Partial<LocalRoomState>) => {
    if (config.useSupabase) {
      const room = await roomService.createRoom(playerName, deckType);
      if (room) {
        setCurrentRoom(room);
        setMyPlayerId(room.players[0]?.id || null);
        return room;
      }
      return null;
    } else {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playerId = Math.floor(Math.random() * 1000000);
      
      const newPlayer = {
        id: playerId,
        name: playerName,
        avatar: undefined,
        isHost: true,
        isObserver: false,
        isLocked: false,
        isReady: true,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        wrongCount: 0,
        totalReactionTime: 0,
        deck: [],
        collected: [],
        seatIndex: 0,
      };

      const newRoom: LocalRoomState = {
        roomId,
        hostId: playerId,
        players: [newPlayer],
        gameMode: 0,
        gamePhase: 0,
        currentCharacterId: null,
        currentQuote: null,
        turnStartTime: null,
        pickEvents: [],
        deckRows: 3,
        deckColumns: 8,
        playbackSetting: {
          countdown: false,
          randomStartPosition: false,
          playbackDuration: 0,
        },
        paused: false,
        pausedTimeRemaining: 0,
        customCards: [],
        deckType,
        deckCards: [],
        currentTurnPicks: [],
        createdAt: Date.now(),
        ...localRoomData,
      };

      roomSync.createRoom(newRoom as any);
      setCurrentRoom(newRoom);
      setMyPlayerId(playerId);
      return newRoom;
    }
  }, [config.useSupabase]);

  const joinRoom = useCallback(async (roomId: string, playerName: string, asObserver: boolean = false) => {
    if (config.useSupabase) {
      const room = await roomService.joinRoom(roomId, playerName, asObserver);
      if (room) {
        setCurrentRoom(room);
        const myPlayer = room.players.find(p => 
          p.userId === user?.id || p.name === playerName
        );
        setMyPlayerId(myPlayer?.id || null);
        return room;
      }
      return null;
    } else {
      const existingRoom = roomSync.getRoom(roomId) as any;
      if (!existingRoom) return null;

      const playerId = Math.floor(Math.random() * 1000000);
      const newPlayer = {
        id: playerId,
        name: playerName,
        avatar: undefined,
        isHost: false,
        isObserver: asObserver,
        isLocked: false,
        isReady: asObserver,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        wrongCount: 0,
        totalReactionTime: 0,
        deck: [],
        collected: [],
        seatIndex: existingRoom.players.length,
      };

      const updatedRoom = roomSync.joinRoom(roomId, newPlayer as any) as any;
      if (updatedRoom) {
        setCurrentRoom(updatedRoom);
        setMyPlayerId(playerId);
        return updatedRoom;
      }
      return null;
    }
  }, [config.useSupabase, user?.id]);

  const leaveRoom = useCallback(async () => {
    if (!currentRoom || !myPlayerId) return;

    if (config.useSupabase && 'id' in currentRoom) {
      await roomService.leaveRoom((currentRoom as RoomState).id, myPlayerId as string);
    } else if ('roomId' in currentRoom) {
      roomSync.leaveRoom((currentRoom as LocalRoomState).roomId, myPlayerId as number);
    }

    setCurrentRoom(null);
    setMyPlayerId(null);
  }, [currentRoom, myPlayerId, config.useSupabase]);

  const updatePlayerReady = useCallback(async (isReady: boolean) => {
    if (!myPlayerId) return;

    if (config.useSupabase && typeof myPlayerId === 'string') {
      await roomService.updatePlayerReady(myPlayerId, isReady);
    } else if (currentRoom && typeof myPlayerId === 'number') {
      const updatedRoom = roomSync.toggleReady((currentRoom as LocalRoomState).roomId, myPlayerId);
      if (updatedRoom) {
        setCurrentRoom(updatedRoom);
      }
    }
  }, [myPlayerId, currentRoom, config.useSupabase]);

  const updateRoom = useCallback(async (updates: Partial<RoomState> | Partial<LocalRoomState>) => {
    if (!currentRoom) return;

    if (config.useSupabase && 'id' in currentRoom) {
      await roomService.updateRoomState((currentRoom as RoomState).id, updates as Partial<RoomState>);
    } else if ('roomId' in currentRoom) {
      const updatedRoom = { ...(currentRoom as LocalRoomState), ...updates };
      roomSync.updateRoom(updatedRoom as any);
      setCurrentRoom(updatedRoom);
    }
  }, [currentRoom, config.useSupabase]);

  const updatePlayer = useCallback(async (updates: Partial<PlayerInfo>) => {
    if (!myPlayerId || !currentRoom) return;

    if (config.useSupabase && typeof myPlayerId === 'string') {
      await roomService.updatePlayerState(myPlayerId, updates);
    } else if (typeof myPlayerId === 'number') {
      const updatedRoom = {
        ...(currentRoom as LocalRoomState),
        players: (currentRoom as LocalRoomState).players.map(p =>
          p.id === myPlayerId ? { ...p, ...updates } : p
        ),
      };
      roomSync.updateRoom(updatedRoom as any);
      setCurrentRoom(updatedRoom);
    }
  }, [myPlayerId, currentRoom, config.useSupabase]);

  const refreshRooms = useCallback(async () => {
    if (config.useSupabase) {
      const roomList = await roomService.getRooms();
      setRooms(roomList);
    } else {
      const localRooms = roomSync.getRoomsList();
      setRooms(localRooms);
    }
  }, [config.useSupabase]);

  const getRoom = useCallback((roomId: string) => {
    if (config.useSupabase) {
      return roomService.getRoomByCode(roomId);
    } else {
      return roomSync.getRoom(roomId);
    }
  }, [config.useSupabase]);

  return {
    config,
    user,
    loading,
    rooms,
    currentRoom,
    myPlayerId,
    isHost: currentRoom ? (
      config.useSupabase 
        ? (currentRoom as RoomState).hostId === user?.id 
        : (currentRoom as LocalRoomState).hostId === myPlayerId
    ) : false,
    signIn,
    signUp,
    signOut,
    createRoom,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    updateRoom,
    updatePlayer,
    refreshRooms,
    getRoom,
    setCurrentRoom,
    setMyPlayerId,
  };
}
