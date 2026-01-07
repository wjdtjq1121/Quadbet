import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Card as CardType } from '../types/GameTypes';
import { SPECIAL_CARDS } from '../constants/SpecialCards';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  onPress,
  size = 'medium',
  disabled = false
}) => {
  const getSuitColor = (suit: string | null): string => {
    switch (suit) {
      case 'jade': return '#27ae60';
      case 'sword': return '#333';
      case 'pagoda': return '#e74c3c';
      case 'star': return '#3498db';
      default: return '#333';
    }
  };

  const getSuitEmoji = (suit: string | null): string => {
    switch (suit) {
      case 'jade': return '♠';
      case 'sword': return '♣';
      case 'pagoda': return '♥';
      case 'star': return '♦';
      default: return '';
    }
  };

  const getCardDisplay = () => {
    if (card.isSpecial) {
      // 특수 카드 표시
      if (card.emoji) {
        return { value: card.emoji, suit: '' };
      }
      
      // 레거시 특수 카드 처리
      switch (card.name) {
        case 'One':
          return { value: '1', suit: '소원' };
        case 'Dog':
          return { value: '🐕', suit: '' };
        case 'Phoenix':
          return { value: '🔥', suit: '' };
        case 'Dragon':
          return { value: '🐉', suit: '' };
        default:
          return { value: card.name, suit: '' };
      }
    }

    // 일반 카드
    const displayValue = card.name;
    const suitEmoji = getSuitEmoji(card.suit);
    return { value: displayValue, suit: suitEmoji };
  };

  const { value, suit } = getCardDisplay();
  const suitColor = getSuitColor(card.suit);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles[size],
        isSelected && styles.selected,
        card.isSpecial && styles.special,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={[
          styles.cardValue,
          styles[`${size}Value`],
          { color: suitColor },
          card.isSpecial && styles.specialValue
        ]}>
          {value}
        </Text>
        
        {suit && (
          <Text style={[
            styles.cardSuit,
            styles[`${size}Suit`],
            { color: suitColor }
          ]}>
            {suit}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  small: {
    width: 40,
    height: 58,
  },
  medium: {
    width: 55,
    height: 80,
  },
  large: {
    width: 70,
    height: 100,
  },
  selected: {
    borderColor: '#667eea',
    backgroundColor: '#e3f2fd',
    transform: [{ translateY: -10 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  special: {
    backgroundColor: '#ffd700',
    borderColor: '#ffed4e',
  },
  disabled: {
    opacity: 0.5,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cardValue: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallValue: {
    fontSize: 12,
  },
  mediumValue: {
    fontSize: 18,
  },
  largeValue: {
    fontSize: 24,
  },
  specialValue: {
    color: '#333',
  },
  cardSuit: {
    textAlign: 'center',
    marginTop: 2,
  },
  smallSuit: {
    fontSize: 8,
  },
  mediumSuit: {
    fontSize: 12,
  },
  largeSuit: {
    fontSize: 16,
  },
});