import database from '@react-native-firebase/database';
import { Room, GameState, Player } from '../types/GameTypes';

class FirebaseService {
  private database = database();

  // Room 관련 메서드
  async createRoom(roomCode: string, hostPlayer: Player): Promise<void> {
    const roomData: Room = {
      code: roomCode,
      host: hostPlayer.id,
      players: { [hostPlayer.position]: hostPlayer },
      gameState: null,
      gameStarted: false,
      playerCount: 1
    };

    await this.database.ref(`rooms/${roomCode}`).set(roomData);
  }

  async joinRoom(roomCode: string, player: Player): Promise<boolean> {
    const roomRef = this.database.ref(`rooms/${roomCode}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val() as Room;

    if (!room || room.playerCount >= 4) {
      return false;
    }

    // 빈 포지션 찾기
    const availablePosition = this.findAvailablePosition(room);
    if (availablePosition === -1) {
      return false;
    }

    player.position = availablePosition;
    
    await roomRef.child(`players/${availablePosition}`).set(player);
    await roomRef.child('playerCount').set(room.playerCount + 1);

    return true;
  }

  async leaveRoom(roomCode: string, playerPosition: number): Promise<void> {
    const roomRef = this.database.ref(`rooms/${roomCode}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val() as Room;

    if (!room) return;

    await roomRef.child(`players/${playerPosition}`).remove();
    await roomRef.child('playerCount').set(room.playerCount - 1);

    // 방이 비었으면 삭제
    if (room.playerCount <= 1) {
      await roomRef.remove();
    }
  }

  async updatePlayerReady(roomCode: string, playerPosition: number, ready: boolean): Promise<void> {
    await this.database.ref(`rooms/${roomCode}/players/${playerPosition}/ready`).set(ready);
  }

  async startGame(roomCode: string, gameState: GameState): Promise<void> {
    const roomRef = this.database.ref(`rooms/${roomCode}`);
    
    await roomRef.update({
      gameStarted: true,
      gameState: gameState
    });
  }

  // 게임 상태 업데이트
  async updateGameState(roomCode: string, gameState: GameState): Promise<void> {
    await this.database.ref(`rooms/${roomCode}/gameState`).set(gameState);
  }

  // 실시간 리스너
  onRoomChange(roomCode: string, callback: (room: Room | null) => void): () => void {
    const roomRef = this.database.ref(`rooms/${roomCode}`);
    
    const listener = roomRef.on('value', (snapshot) => {
      const room = snapshot.val() as Room | null;
      callback(room);
    });

    // 리스너 해제 함수 반환
    return () => {
      roomRef.off('value', listener);
    };
  }

  onRoomsListChange(callback: (rooms: { [key: string]: Room } | null) => void): () => void {
    const roomsRef = this.database.ref('rooms');
    
    const listener = roomsRef.on('value', (snapshot) => {
      const rooms = snapshot.val() as { [key: string]: Room } | null;
      callback(rooms);
    });

    return () => {
      roomsRef.off('value', listener);
    };
  }

  onConnectionStatus(callback: (connected: boolean) => void): () => void {
    const connectedRef = this.database.ref('.info/connected');
    
    const listener = connectedRef.on('value', (snapshot) => {
      const connected = snapshot.val() === true;
      callback(connected);
    });

    return () => {
      connectedRef.off('value', listener);
    };
  }

  // 유틸리티 메서드
  private findAvailablePosition(room: Room): number {
    for (let i = 0; i < 4; i++) {
      if (!room.players[i]) {
        return i;
      }
    }
    return -1;
  }

  // 봇 추가
  async addBot(roomCode: string, botPlayer: Player): Promise<boolean> {
    const roomRef = this.database.ref(`rooms/${roomCode}`);
    const snapshot = await roomRef.once('value');
    const room = snapshot.val() as Room;

    if (!room || room.playerCount >= 4) {
      return false;
    }

    const availablePosition = this.findAvailablePosition(room);
    if (availablePosition === -1) {
      return false;
    }

    botPlayer.position = availablePosition;
    
    await roomRef.child(`players/${availablePosition}`).set(botPlayer);
    await roomRef.child('playerCount').set(room.playerCount + 1);

    return true;
  }

  // 방 삭제 (호스트만)
  async deleteRoom(roomCode: string): Promise<void> {
    await this.database.ref(`rooms/${roomCode}`).remove();
  }
}

export default new FirebaseService();