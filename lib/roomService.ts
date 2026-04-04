import { supabase, isSupabaseConfigured } from './supabase';
import { authService } from './authService';
import { roomSync } from './roomSync';
import type { Room, RoomPlayer } from './database.types';

const db = supabase as any;
const LOBBY_ROOM_TTL_MS = 10 * 60 * 1000;
const ENDED_ROOM_TTL_MS = 5 * 60 * 1000;
const ACTIVE_ROOM_TTL_MS = 60 * 60 * 1000;

export type RoomInfo = {
  id: string;
  code: string;
  hostId: string | null;
  hostName: string;
  gameMode: number;
  gamePhase: number;
  deckType: string | null;
  playerCount: number;
  createdAt: string;
  gameEndedAt: string | null;
};

export type PlayerInfo = {
  id: string;
  userId: string | null;
  name: string;
  avatar: string | null;
  isHost: boolean;
  isObserver: boolean;
  isReady: boolean;
  isLocked: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  wrongCount: number;
  totalReactionTime: number;
  seatIndex: number;
  deck: any[] | null;
  collected: any[] | null;
};

export type RoomState = {
  id: string;
  code: string;
  hostId: string | null;
  gameMode: number;
  gamePhase: number;
  deckType: string | null;
  deckCards: any[] | null;
  customCards: any[] | null;
  currentCharacterId: string | null;
  currentQuote: string | null;
  turnStartTime: string | null;
  paused: boolean;
  pausedTimeRemaining: number;
  players: PlayerInfo[];
  currentTurnPicks: Array<{
    playerId: string | number;
    cardId: string;
    isCorrect: boolean;
    reactionTime: number;
  }>;
  createdAt: string;
  gameEndedAt: string | null;
};

export type SupabaseRoomDiagnostic = {
  summary: string;
  details: string[];
  checks: Array<{
    name: string;
    ok: boolean;
    message: string;
  }>;
};

class RoomService {
  private subscriptions: Map<string, any> = new Map();

  private async cleanupSupabaseRooms(): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const now = Date.now();
    const staleLobbyCutoff = new Date(now - LOBBY_ROOM_TTL_MS).toISOString();
    const endedRoomCutoff = new Date(now - ENDED_ROOM_TTL_MS).toISOString();
    const activeRoomCutoff = new Date(now - ACTIVE_ROOM_TTL_MS).toISOString();

    const { error: endedError } = await db
      .from('rooms')
      .delete()
      .not('game_ended_at', 'is', null)
      .lt('game_ended_at', endedRoomCutoff);

    if (endedError) {
      console.error('Error cleaning up ended rooms:', endedError);
    }

    const { error: activeRoomError } = await db
      .from('rooms')
      .delete()
      .eq('game_phase', 2)
      .lt('created_at', activeRoomCutoff);

    if (activeRoomError) {
      console.error('Error cleaning up long-running active rooms:', activeRoomError);
    }

    const { error: staleLobbyError } = await db
      .from('rooms')
      .delete()
      .eq('game_phase', 0)
      .lt('created_at', staleLobbyCutoff);

    if (staleLobbyError) {
      console.error('Error cleaning up stale lobby rooms:', staleLobbyError);
    }
  }

  async diagnoseSupabaseRoomAccess(): Promise<SupabaseRoomDiagnostic> {
    if (!isSupabaseConfigured()) {
      return {
        summary: 'Supabase 未配置，当前会使用本地房间模式。',
        details: ['请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。'],
        checks: [
          { name: 'supabase-config', ok: false, message: '缺少 Supabase 环境变量。' },
        ],
      };
    }

    const checks: SupabaseRoomDiagnostic['checks'] = [];

    const roomListResult = await db.from('room_list_view').select('*').limit(1);
    checks.push({
      name: 'room_list_view',
      ok: !roomListResult.error,
      message: roomListResult.error?.message || 'room_list_view 可访问。',
    });

    const roomsResult = await db.from('rooms').select('id,code').limit(1);
    checks.push({
      name: 'rooms',
      ok: !roomsResult.error,
      message: roomsResult.error?.message || 'rooms 表可访问。',
    });

    const roomPlayersResult = await db.from('room_players').select('id,room_id').limit(1);
    checks.push({
      name: 'room_players',
      ok: !roomPlayersResult.error,
      message: roomPlayersResult.error?.message || 'room_players 表可访问。',
    });

    const failedChecks = checks.filter((check) => !check.ok);
    if (failedChecks.length === 0) {
      return {
        summary: 'Supabase 房间相关表看起来可访问。',
        details: ['如果创建房间仍失败，更可能是插入权限、远端 schema 未完全同步，或运行时网络问题。'],
        checks,
      };
    }

    const details = failedChecks.map((check) => {
      const message = check.message.toLowerCase();
      if (message.includes('relation') || message.includes('does not exist')) {
        return `${check.name} 缺失，通常表示 supabase/schema.sql 还没完整执行。`;
      }
      if (message.includes('permission') || message.includes('policy')) {
        return `${check.name} 权限或 RLS 策略有问题。`;
      }
      return `${check.name}: ${check.message}`;
    });

    return {
      summary: 'Supabase 房间环境存在问题，联机创建/加入房间可能失败。',
      details,
      checks,
    };
  }

  async getRooms(): Promise<RoomInfo[]> {
    if (!isSupabaseConfigured()) {
      const localRooms = roomSync.getRoomsList();
      return localRooms.map(room => ({
        id: room.roomId,
        code: room.roomId,
        hostId: null,
        hostName: room.hostName,
        gameMode: 0,
        gamePhase: room.phase,
        deckType: null,
        playerCount: room.playerCount,
        createdAt: new Date().toISOString(),
        gameEndedAt: null,
      }));
    }

    await this.cleanupSupabaseRooms();

    const { data, error } = await db
      .from('room_list_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }

    return ((data || []) as any[]).map((room: any) => ({
      id: room.id,
      code: room.code,
      hostId: room.host_id,
      hostName: room.host_name || 'Unknown',
      gameMode: room.game_mode,
      gamePhase: room.game_phase,
      deckType: room.deck_type,
      playerCount: room.player_count,
      createdAt: room.created_at,
      gameEndedAt: room.game_ended_at,
    }));
  }

  async getRoomByCode(code: string): Promise<RoomState | null> {
    if (!isSupabaseConfigured()) {
      const localRoom = roomSync.getRoom(code.toUpperCase());
      if (!localRoom) return null;
      return this.localRoomToState(localRoom);
    }

    await this.cleanupSupabaseRooms();

    const { data: room, error: roomError } = await db
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (roomError || !room) {
      return null;
    }

    const { data: players } = await db
      .from('room_players')
      .select('*')
      .eq('room_id', room.id)
      .order('seat_index', { ascending: true });

    const { data: pickEvents } = await db
      .from('pick_events')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const currentTurnPicks = ((pickEvents || []) as any[])
      .filter((e: any) => room.current_character_id && e.card_id)
      .slice(0, 10)
      .map((e: any) => ({
        playerId: e.player_id,
        cardId: e.card_id,
        isCorrect: e.is_correct,
        reactionTime: e.reaction_time,
      }));

    return {
      id: room.id,
      code: room.code,
      hostId: room.host_id,
      gameMode: room.game_mode,
      gamePhase: room.game_phase,
      deckType: room.deck_type,
      deckCards: room.deck_cards as any[] | null,
      customCards: room.custom_cards as any[] | null,
      currentCharacterId: room.current_character_id,
      currentQuote: room.current_quote,
      turnStartTime: room.turn_start_time,
      paused: room.paused,
      pausedTimeRemaining: room.paused_time_remaining,
      players: ((players || []) as any[]).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.is_host,
        isObserver: p.is_observer,
        isReady: p.is_ready,
        isLocked: p.is_locked,
        score: p.score,
        combo: p.combo,
        maxCombo: p.max_combo,
        correctCount: p.correct_count,
        wrongCount: p.wrong_count,
        totalReactionTime: p.total_reaction_time,
        seatIndex: p.seat_index,
        deck: p.deck as any[] | null,
        collected: p.collected as any[] | null,
      })),
      currentTurnPicks,
      createdAt: room.created_at,
      gameEndedAt: room.game_ended_at,
    };
  }

  async createRoom(playerName: string, deckType: 'anime2026' | 'custom' = 'anime2026'): Promise<RoomState | null> {
    if (!isSupabaseConfigured()) {
      const code = this.generateRoomCode();
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

      const localRoom = {
        roomId: code,
        hostId: playerId,
        players: [newPlayer],
        gameMode: 0 as const,
        gamePhase: 0 as const,
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
      };

      roomSync.createRoom(localRoom);
      return this.localRoomToState(localRoom);
    }

    await this.cleanupSupabaseRooms();

    const user = authService.getCurrentUser();
    const code = this.generateRoomCode();
    
    const { data: room, error: roomError } = await db
      .from('rooms')
      .insert({
        code,
        host_id: user?.id || null,
        game_mode: 0,
        game_phase: 0,
        deck_type: deckType,
      })
      .select()
      .single();

    if (roomError || !room) {
      console.error('Error creating room:', roomError);
      return null;
    }

    const { data: player, error: playerError } = await db
      .from('room_players')
      .insert({
        room_id: room.id,
        user_id: user?.id || null,
        name: playerName,
        avatar: user?.avatar || null,
        is_host: true,
        is_observer: false,
        is_ready: true,
        seat_index: 0,
      })
      .select()
      .single();

    if (playerError || !player) {
      console.error('Error creating player:', playerError);
      await db.from('rooms').delete().eq('id', room.id);
      return null;
    }

    return {
      id: room.id,
      code: room.code,
      hostId: room.host_id,
      gameMode: room.game_mode,
      gamePhase: room.game_phase,
      deckType: room.deck_type,
      deckCards: room.deck_cards as any[] | null,
      customCards: room.custom_cards as any[] | null,
      currentCharacterId: room.current_character_id,
      currentQuote: room.current_quote,
      turnStartTime: room.turn_start_time,
      paused: room.paused,
      pausedTimeRemaining: room.paused_time_remaining,
      players: [{
        id: player.id,
        userId: player.user_id,
        name: player.name,
        avatar: player.avatar,
        isHost: player.is_host,
        isObserver: player.is_observer,
        isReady: player.is_ready,
        isLocked: player.is_locked,
        score: player.score,
        combo: player.combo,
        maxCombo: player.max_combo,
        correctCount: player.correct_count,
        wrongCount: player.wrong_count,
        totalReactionTime: player.total_reaction_time,
        seatIndex: player.seat_index,
        deck: player.deck as any[] | null,
        collected: player.collected as any[] | null,
      }],
      currentTurnPicks: [],
      createdAt: room.created_at,
      gameEndedAt: room.game_ended_at,
    };
  }

  async joinRoom(code: string, playerName: string, asObserver: boolean = false): Promise<RoomState | null> {
    if (!isSupabaseConfigured()) {
      const existingRoom = roomSync.getRoom(code);
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

      const updatedRoom = roomSync.joinRoom(code, newPlayer);
      if (!updatedRoom) return null;
      return this.localRoomToState(updatedRoom);
    }

    await this.cleanupSupabaseRooms();

    const room = await this.getRoomByCode(code);
    if (!room) return null;

    const user = authService.getCurrentUser();
    const existingPlayer = room.players.find(p => p.userId === user?.id);
    if (existingPlayer) return room;

    const maxSeatIndex = Math.max(0, ...room.players.map(p => p.seatIndex));

    const { data: player, error: playerError } = await db
      .from('room_players')
      .insert({
        room_id: room.id,
        user_id: user?.id || null,
        name: playerName,
        avatar: user?.avatar || null,
        is_host: false,
        is_observer: asObserver,
        is_ready: asObserver,
        seat_index: maxSeatIndex + 1,
      })
      .select()
      .single();

    if (playerError) {
      console.error('Error joining room:', playerError);
      return null;
    }

    return this.getRoomByCode(code);
  }

  async leaveRoom(roomId: string, playerId: string | number): Promise<void> {
    if (!isSupabaseConfigured()) {
      roomSync.leaveRoom(roomId, playerId as number);
      return;
    }

    const { error } = await db
      .from('room_players')
      .delete()
      .eq('id', playerId);

    if (error) {
      console.error('Error leaving room:', error);
    }

    const { data: remainingPlayers } = await db
      .from('room_players')
      .select('id')
      .eq('room_id', roomId);

    if (!remainingPlayers || remainingPlayers.length === 0) {
      await db.from('rooms').delete().eq('id', roomId);
    }
  }

  async updatePlayerReady(playerId: string | number, isReady: boolean): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    await db
      .from('room_players')
      .update({ is_ready: isReady })
      .eq('id', playerId);
  }

  async updateRoomState(roomIdOrCode: string, updates: Partial<RoomState>): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    let roomUuid = roomIdOrCode;
    
    if (roomIdOrCode.length <= 8) {
      const { data: roomData } = await db
        .from('rooms')
        .select('id')
        .eq('code', roomIdOrCode.toUpperCase())
        .single();
      
      if (!roomData) {
        console.error('Room not found:', roomIdOrCode);
        return;
      }
      roomUuid = roomData.id;
    }

    const dbUpdates: any = {};
    
    if (updates.gameMode !== undefined) dbUpdates.game_mode = updates.gameMode;
    if (updates.gamePhase !== undefined) dbUpdates.game_phase = updates.gamePhase;
    if (updates.deckType !== undefined) dbUpdates.deck_type = updates.deckType;
    if (updates.deckCards !== undefined) dbUpdates.deck_cards = updates.deckCards;
    if (updates.customCards !== undefined) dbUpdates.custom_cards = updates.customCards;
    if (updates.currentCharacterId !== undefined) dbUpdates.current_character_id = updates.currentCharacterId;
    if (updates.currentQuote !== undefined) dbUpdates.current_quote = updates.currentQuote;
    if (updates.turnStartTime !== undefined) dbUpdates.turn_start_time = updates.turnStartTime;
    if (updates.paused !== undefined) dbUpdates.paused = updates.paused;
    if (updates.pausedTimeRemaining !== undefined) dbUpdates.paused_time_remaining = updates.pausedTimeRemaining;
    if (updates.gameEndedAt !== undefined) dbUpdates.game_ended_at = updates.gameEndedAt;

    await db
      .from('rooms')
      .update(dbUpdates)
      .eq('id', roomUuid);
  }

  async updatePlayerState(playerId: string | number, updates: Partial<PlayerInfo>): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const dbUpdates: any = {};
    
    if (updates.score !== undefined) dbUpdates.score = updates.score;
    if (updates.combo !== undefined) dbUpdates.combo = updates.combo;
    if (updates.maxCombo !== undefined) dbUpdates.max_combo = updates.maxCombo;
    if (updates.correctCount !== undefined) dbUpdates.correct_count = updates.correctCount;
    if (updates.wrongCount !== undefined) dbUpdates.wrong_count = updates.wrongCount;
    if (updates.totalReactionTime !== undefined) dbUpdates.total_reaction_time = updates.totalReactionTime;
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
    if (updates.deck !== undefined) dbUpdates.deck = updates.deck;
    if (updates.collected !== undefined) dbUpdates.collected = updates.collected;

    await db
      .from('room_players')
      .update(dbUpdates)
      .eq('id', playerId);
  }

  async recordPickEvent(roomIdOrCode: string, playerId: string | number, cardId: string, isCorrect: boolean, reactionTime: number): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    let roomUuid = roomIdOrCode;
    
    if (roomIdOrCode.length <= 8) {
      const { data: roomData } = await db
        .from('rooms')
        .select('id')
        .eq('code', roomIdOrCode.toUpperCase())
        .single();
      
      if (!roomData) return;
      roomUuid = roomData.id;
    }

    await db
      .from('pick_events')
      .insert({
        room_id: roomUuid,
        player_id: playerId,
        card_id: cardId,
        is_correct: isCorrect,
        reaction_time: reactionTime,
      });
  }

  async deleteRoom(roomId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }
    await db.from('rooms').delete().eq('id', roomId);
  }

  async sendChatMessage(roomIdOrCode: string, playerId: string | number, playerName: string, message: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    let roomUuid = roomIdOrCode;
    
    if (roomIdOrCode.length <= 8) {
      const { data: roomData } = await db
        .from('rooms')
        .select('id')
        .eq('code', roomIdOrCode.toUpperCase())
        .single();
      
      if (!roomData) return;
      roomUuid = roomData.id;
    }

    const { error } = await db
      .from('chat_messages')
      .insert({
        room_id: roomUuid,
        player_id: null,
        player_name: playerName,
        message,
      });
    
    if (error) {
      console.error('Error sending chat message:', error);
    }
  }

  async getChatMessages(roomIdOrCode: string, limit: number = 50): Promise<Array<{id: string; playerId: string | number; playerName: string; message: string; createdAt: string}>> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let roomUuid = roomIdOrCode;
    
    if (roomIdOrCode.length <= 8) {
      const { data: roomData } = await db
        .from('rooms')
        .select('id')
        .eq('code', roomIdOrCode.toUpperCase())
        .single();
      
      if (!roomData) return [];
      roomUuid = roomData.id;
    }

    const { data, error } = await db
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomUuid)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return (data as any[]).map((msg: any) => ({
      id: msg.id,
      playerId: msg.player_id,
      playerName: msg.player_name,
      message: msg.message,
      createdAt: msg.created_at,
    }));
  }

  subscribeToRoom(roomIdOrCode: string, callback: (room: RoomState | null) => void): () => void {
    if (!isSupabaseConfigured()) {
      const unsubscribe = roomSync.subscribe(roomIdOrCode, (event) => {
        if (event.type === 'ROOM_UPDATED' || event.type === 'PLAYER_JOINED' || event.type === 'PLAYER_READY') {
          if ((event.payload as any)?.deleted) {
            callback(null);
            return;
          }
          const localRoom = roomSync.getRoom(roomIdOrCode);
          callback(localRoom ? this.localRoomToState(localRoom) : null);
        }
      });
      return unsubscribe;
    }

    const setupSubscription = async () => {
      let roomUuid = roomIdOrCode;
      
      if (roomIdOrCode.length <= 8) {
        const { data: roomData } = await db
          .from('rooms')
          .select('id')
          .eq('code', roomIdOrCode.toUpperCase())
          .single();
        
        if (!roomData) {
          callback(null);
          return () => {};
        }
        roomUuid = roomData.id;
      }

      const channel = db
        .channel(`room:${roomUuid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomUuid}`,
          },
          async () => {
            const codeResult = await db.from('rooms').select('code').eq('id', roomUuid).single();
            if (codeResult.data?.code) {
              const room = await this.getRoomByCode(codeResult.data.code);
              callback(room);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_players',
            filter: `room_id=eq.${roomUuid}`,
          },
          async () => {
            const codeResult = await db.from('rooms').select('code').eq('id', roomUuid).single();
            if (codeResult.data?.code) {
              const room = await this.getRoomByCode(codeResult.data.code);
              callback(room);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pick_events',
            filter: `room_id=eq.${roomUuid}`,
          },
          async () => {
            const codeResult = await db.from('rooms').select('code').eq('id', roomUuid).single();
            if (codeResult.data?.code) {
              const room = await this.getRoomByCode(codeResult.data.code);
              callback(room);
            }
          }
        )
        .subscribe();

      this.subscriptions.set(roomUuid, channel);

      return () => {
        channel.unsubscribe();
        this.subscriptions.delete(roomUuid);
      };
    };

    let unsubscribe: (() => void) | null = null;
    setupSubscription().then((fn) => {
      unsubscribe = fn;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }

  subscribeToChat(roomIdOrCode: string, callback: (message: {id: string; playerId: string | number; playerName: string; message: string; createdAt: string}) => void): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const setupSubscription = async () => {
      let roomUuid = roomIdOrCode;
      
      if (roomIdOrCode.length <= 8) {
        const { data: roomData } = await db
          .from('rooms')
          .select('id')
          .eq('code', roomIdOrCode.toUpperCase())
          .single();
        
        if (!roomData) return () => {};
        roomUuid = roomData.id;
      }

      const channel = db
        .channel(`chat:${roomUuid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomUuid}`,
          },
          (payload: any) => {
            const msg = payload.new as any;
            callback({
              id: msg.id,
              playerId: msg.player_id,
              playerName: msg.player_name,
              message: msg.message,
              createdAt: msg.created_at,
            });
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    let unsubscribe: (() => void) | null = null;
    setupSubscription().then((fn) => {
      unsubscribe = fn;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }

  private localRoomToState(localRoom: any): RoomState {
    return {
      id: localRoom.roomId,
      code: localRoom.roomId,
      hostId: null,
      gameMode: localRoom.gameMode,
      gamePhase: localRoom.gamePhase,
      deckType: localRoom.deckType,
      deckCards: localRoom.deckCards,
      customCards: localRoom.customCards,
      currentCharacterId: localRoom.currentCharacterId,
      currentQuote: localRoom.currentQuote,
      turnStartTime: localRoom.turnStartTime ? new Date(localRoom.turnStartTime).toISOString() : null,
      paused: localRoom.paused,
      pausedTimeRemaining: localRoom.pausedTimeRemaining,
      players: localRoom.players.map((p: any) => ({
        id: String(p.id),
        userId: null,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isObserver: p.isObserver,
        isReady: p.isReady,
        isLocked: p.isLocked,
        score: p.score,
        combo: p.combo,
        maxCombo: p.maxCombo,
        correctCount: p.correctCount,
        wrongCount: p.wrongCount,
        totalReactionTime: p.totalReactionTime,
        seatIndex: p.seatIndex,
        deck: p.deck,
        collected: p.collected,
      })),
      currentTurnPicks: [],
      createdAt: new Date(localRoom.createdAt).toISOString(),
      gameEndedAt: null,
    };
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const roomService = new RoomService();
