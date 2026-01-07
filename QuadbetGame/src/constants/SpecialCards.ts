// 특수 카드 상수 정의
export const SPECIAL_CARDS = {
  // 1번 카드 (마작 → 소원)
  ONE: {
    name: 'One',
    value: 1,
    emoji: '1️⃣',
    points: 0,
    description: '가장 낮은 카드. 원하는 숫자를 지정할 수 있습니다.'
  },
  
  // 강아지 (개 → 강아지, 고양이 삭제)
  DOG: {
    name: 'Dog', 
    emoji: '🐕',
    points: 0,
    description: '파트너에게 리드권을 넘깁니다. 첫 번째 차례에만 사용 가능합니다.'
  },
  
  // 봉황 (피닉스)
  PHOENIX: {
    name: 'Phoenix',
    emoji: '🔥',
    points: -25,
    description: '와일드카드로 사용 가능. -25점의 가치를 가집니다.'
  },
  
  // 용 (호랑이 → 용으로 변경)
  DRAGON: {
    name: 'Dragon',
    value: 15,
    emoji: '🐉',
    points: 25,
    description: '가장 높은 카드. +25점의 가치를 가집니다.'
  }
} as const;

// 특수 카드 이름 매핑 (기존 코드 호환성)
export const LEGACY_CARD_MAPPING = {
  'Mah Jong': 'One',
  '마작': 'One',
  'Cat': 'Dog',  // 고양이 → 강아지로 매핑
  '고양이': 'Dog',
  'Tiger': 'Dragon',  // 호랑이 → 용으로 매핑
  '호랑이': 'Dragon'
} as const;

// 특수 카드인지 확인하는 함수
export const isSpecialCard = (cardName: string): boolean => {
  const normalizedName = LEGACY_CARD_MAPPING[cardName as keyof typeof LEGACY_CARD_MAPPING] || cardName;
  return Object.values(SPECIAL_CARDS).some(card => card.name === normalizedName);
};

// 특수 카드 정보 가져오기
export const getSpecialCardInfo = (cardName: string) => {
  const normalizedName = LEGACY_CARD_MAPPING[cardName as keyof typeof LEGACY_CARD_MAPPING] || cardName;
  return Object.values(SPECIAL_CARDS).find(card => card.name === normalizedName);
};