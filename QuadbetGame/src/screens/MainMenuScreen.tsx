import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
// import { useNavigation } from '@react-navigation/native'; // Navigation 불필요

interface MainMenuScreenProps {
  onNicknameSet: (nickname: string) => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ onNicknameSet }) => {
  const [nickname, setNickname] = useState('');
  const [showNicknameInput, setShowNicknameInput] = useState(false);

  const handleStartGame = () => {
    setShowNicknameInput(true);
  };

  const handleNicknameSubmit = () => {
    const trimmedNickname = nickname.trim();
    
    if (!trimmedNickname) {
      Alert.alert('오류', '닉네임을 입력해주세요!');
      return;
    }

    if (trimmedNickname.length < 2) {
      Alert.alert('오류', '닉네임은 2자 이상이어야 합니다!');
      return;
    }

    if (trimmedNickname.length > 10) {
      Alert.alert('오류', '닉네임은 10자 이하여야 합니다!');
      return;
    }

    onNicknameSet(trimmedNickname);
  };

  const showGameRules = () => {
    Alert.alert(
      '게임 방법',
      `🎴 티추 (Tichu) - 4인 카드 게임

🎯 목표: 1000점 먼저 달성하는 팀 승리

👥 팀 구성:
• 팀 1: 남(나) + 북(파트너)  
• 팀 2: 서 + 동

🃏 특수 카드:
• 소원(1): 원하는 숫자 지정 가능
• 강아지🐕: 파트너에게 리드권 전달
• 봉황🔥: 와일드카드 (-25점)
• 용🐉: 가장 높은 카드 (+25점)

🎲 게임 진행:
1. 각 플레이어 14장씩
2. 소원 카드 보유자가 선공
3. 같은 조합의 더 높은 카드 내기
4. 3명 연속 패스 시 테이블 클리어

💰 점수:
• 5: 5점, 10/K: 10점
• 같은 팀 1-2등: 200점
• 베팅 성공/실패: ±100/200점`,
      [{ text: '확인' }]
    );
  };

  const handleDeveloperMode = () => {
    // 개발자 모드용 자동 닉네임
    const devNickname = `Dev_${Math.random().toString(36).substr(2, 5)}`;
    onNicknameSet(devNickname);
  };

  if (showNicknameInput) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>🎴 티추 (Tichu)</Text>
            <Text style={styles.subtitle}>플레이어 정보 입력</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.inputLabel}>닉네임을 입력하세요</Text>
            
            <TextInput
              style={styles.textInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임 (2-10자)"
              maxLength={10}
              autoFocus
              onSubmitEditing={handleNicknameSubmit}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleNicknameSubmit}
              >
                <Text style={styles.buttonText}>확인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowNicknameInput(false)}
              >
                <Text style={styles.buttonText}>뒤로</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🎴 티추 (Tichu)</Text>
          <Text style={styles.subtitle}>4인 전용 온라인 카드 게임</Text>
          <Text style={styles.version}>v2.0.0 React Native</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleStartGame}
            >
              <Text style={styles.buttonText}>게임 시작</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={showGameRules}
            >
              <Text style={styles.buttonText}>게임 방법</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.warningButton]}
              onPress={handleDeveloperMode}
            >
              <Text style={styles.buttonText}>🚀 개발자 모드</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', // CSS gradient fallback
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 20,
    padding: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
  },
  warningButton: {
    backgroundColor: '#f39c12',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});