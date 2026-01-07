import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { useFirebase } from '../hooks/useFirebase';
import { Room } from '../types/GameTypes';

interface LobbyScreenProps {
  nickname: string;
  onCreateRoom: (roomCode: string) => void;
  onJoinRoom: (roomCode: string) => void;
  onLogout: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  nickname,
  onCreateRoom,
  onJoinRoom,
  onLogout
}) => {
  const [roomCode, setRoomCode] = useState('');
  const { connected, rooms, listenToRooms, FirebaseService } = useFirebase();
  
  useEffect(() => {
    const unsubscribe = listenToRooms();
    return unsubscribe;
  }, []);

  const handleCreateRoom = async () => {
    try {
      const newRoomCode = generateRoomCode();
      onCreateRoom(newRoomCode);
    } catch (error) {
      Alert.alert('오류', '방 생성에 실패했습니다.');
      console.error('Room creation error:', error);
    }
  };

  const handleJoinRoom = async () => {
    const trimmedCode = roomCode.trim().toUpperCase();
    
    if (!trimmedCode) {
      Alert.alert('오류', '방 코드를 입력해주세요!');
      return;
    }

    if (trimmedCode.length !== 6) {
      Alert.alert('오류', '방 코드는 6자리입니다!');
      return;
    }

    try {
      onJoinRoom(trimmedCode);
    } catch (error) {
      Alert.alert('오류', '방 참가에 실패했습니다.');
      console.error('Room join error:', error);
    }
  };

  const generateRoomCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const getAvailableRooms = (): { code: string; room: Room }[] => {
    if (!rooms) return [];
    
    return Object.entries(rooms)
      .filter(([code, room]) => !room.gameStarted && room.playerCount < 4)
      .map(([code, room]) => ({ code, room }));
  };

  const renderRoomItem = ({ item }: { item: { code: string; room: Room } }) => {
    const { code, room } = item;
    
    return (
      <View style={styles.roomItem}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomCode}>{code}</Text>
          <Text style={styles.roomPlayers}>{room.playerCount}/4 플레이어</Text>
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => onJoinRoom(code)}
        >
          <Text style={styles.joinButtonText}>참가</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const availableRooms = getAvailableRooms();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>로비</Text>
          <Text style={styles.playerName}>👤 {nickname}</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionIndicator, 
              { backgroundColor: connected ? '#27ae60' : '#e74c3c' }
            ]} />
            <Text style={styles.connectionText}>
              {connected ? '연결됨' : '연결 끊김'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* 방 만들기 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 방 만들기</Text>
            <Text style={styles.sectionDescription}>
              새로운 게임 방을 만들고 친구들을 초대하세요
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateRoom}
              disabled={!connected}
            >
              <Text style={styles.buttonText}>방 만들기</Text>
            </TouchableOpacity>
          </View>

          {/* 방 참가 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 방 참가하기</Text>
            <Text style={styles.sectionDescription}>
              방 코드를 입력하여 게임에 참가하세요
            </Text>
            <TextInput
              style={styles.textInput}
              value={roomCode}
              onChangeText={setRoomCode}
              placeholder="6자리 방 코드"
              maxLength={6}
              autoCapitalize="characters"
              onSubmitEditing={handleJoinRoom}
            />
            <TouchableOpacity
              style={[styles.button, styles.joinButtonStyle]}
              onPress={handleJoinRoom}
              disabled={!connected}
            >
              <Text style={styles.buttonText}>참가하기</Text>
            </TouchableOpacity>
          </View>

          {/* 방 목록 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 방 목록</Text>
            <Text style={styles.sectionDescription}>
              대기 중인 방에 참가하세요
            </Text>
            
            {availableRooms.length > 0 ? (
              <FlatList
                data={availableRooms}
                renderItem={renderRoomItem}
                keyExtractor={(item) => item.code}
                style={styles.roomList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={styles.emptyText}>대기 중인 방이 없습니다</Text>
            )}
          </View>

          {/* 로그아웃 버튼 */}
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={onLogout}
          >
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  content: {
    gap: 25,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#667eea',
  },
  joinButtonStyle: {
    backgroundColor: '#27ae60',
  },
  logoutButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomList: {
    maxHeight: 200,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  roomInfo: {
    flex: 1,
  },
  roomCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  roomPlayers: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});