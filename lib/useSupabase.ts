import { useState, useEffect, useCallback } from 'react';
import { authService, AuthUser } from './authService';
import { roomService, RoomState, RoomInfo, PlayerInfo } from './roomService';

export type { RoomState, RoomInfo, PlayerInfo };

export function useSupabase() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribe((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      const roomList = await roomService.getRooms();
      setRooms(roomList);
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentRoom?.id) return;

    const unsubscribe = roomService.subscribeToRoom(currentRoom.id, (room) => {
      if (room) {
        setCurrentRoom(room);
      } else {
        setCurrentRoom(null);
      }
    });

    return () => unsubscribe();
  }, [currentRoom?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    return authService.signIn(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    return authService.signUp(email, password, displayName);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setCurrentRoom(null);
    setMyPlayerId(null);
  }, []);

  const createRoom = useCallback(async (playerName: string, deckType: 'anime2026' | 'custom' = 'anime2026') => {
    const room = await roomService.createRoom(playerName, deckType);
    if (room) {
      setCurrentRoom(room);
      setMyPlayerId(room.players[0]?.id || null);
      return room;
    }
    return null;
  }, []);

  const joinRoom = useCallback(async (code: string, playerName: string, asObserver: boolean = false) => {
    const room = await roomService.joinRoom(code, playerName, asObserver);
    if (room) {
      setCurrentRoom(room);
      const myPlayer = room.players.find(p => 
        p.userId === user?.id || p.name === playerName
      );
      setMyPlayerId(myPlayer?.id || null);
      return room;
    }
    return null;
  }, [user?.id]);

  const leaveRoom = useCallback(async () => {
    if (currentRoom && myPlayerId) {
      await roomService.leaveRoom(currentRoom.id, myPlayerId);
      setCurrentRoom(null);
      setMyPlayerId(null);
    }
  }, [currentRoom, myPlayerId]);

  const updatePlayerReady = useCallback(async (isReady: boolean) => {
    if (myPlayerId) {
      await roomService.updatePlayerReady(myPlayerId, isReady);
    }
  }, [myPlayerId]);

  const updateRoomState = useCallback(async (updates: Partial<RoomState>) => {
    if (currentRoom) {
      await roomService.updateRoomState(currentRoom.id, updates);
    }
  }, [currentRoom]);

  const updatePlayerState = useCallback(async (updates: Partial<PlayerInfo>) => {
    if (myPlayerId) {
      await roomService.updatePlayerState(myPlayerId, updates);
    }
  }, [myPlayerId]);

  const refreshRooms = useCallback(async () => {
    const roomList = await roomService.getRooms();
    setRooms(roomList);
  }, []);

  return {
    user,
    loading,
    rooms,
    currentRoom,
    myPlayerId,
    signIn,
    signUp,
    signOut,
    createRoom,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    updateRoomState,
    updatePlayerState,
    refreshRooms,
    setCurrentRoom,
    setMyPlayerId,
  };
}
