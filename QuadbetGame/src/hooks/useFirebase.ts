import { useState, useEffect, useCallback } from 'react';
import FirebaseService from '../services/FirebaseService';
import { Room, GameState, Player } from '../types/GameTypes';

export const useFirebase = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [rooms, setRooms] = useState<{ [key: string]: Room } | null>(null);

  useEffect(() => {
    // Firebase 연결 상태 모니터링
    const unsubscribe = FirebaseService.onConnectionStatus(setConnected);
    return unsubscribe;
  }, []);

  const listenToRooms = useCallback(() => {
    return FirebaseService.onRoomsListChange(setRooms);
  }, []);

  return {
    connected,
    rooms,
    listenToRooms,
    FirebaseService
  };
};

export const useRoom = (roomCode: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      return;
    }

    setLoading(true);
    const unsubscribe = FirebaseService.onRoomChange(roomCode, (updatedRoom) => {
      setRoom(updatedRoom);
      setLoading(false);
    });

    return unsubscribe;
  }, [roomCode]);

  const updateGameState = useCallback(async (gameState: GameState) => {
    if (roomCode) {
      await FirebaseService.updateGameState(roomCode, gameState);
    }
  }, [roomCode]);

  const updatePlayerReady = useCallback(async (playerPosition: number, ready: boolean) => {
    if (roomCode) {
      await FirebaseService.updatePlayerReady(roomCode, playerPosition, ready);
    }
  }, [roomCode]);

  const leaveRoom = useCallback(async (playerPosition: number) => {
    if (roomCode) {
      await FirebaseService.leaveRoom(roomCode, playerPosition);
    }
  }, [roomCode]);

  return {
    room,
    loading,
    updateGameState,
    updatePlayerReady,
    leaveRoom
  };
};