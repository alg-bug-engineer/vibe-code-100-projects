// ========================================
// FlashCard Pro - 卡片数据库
// ========================================

const cardData = [
  {
    id: 1,
    word: 'butterfly',
    translation: '蝴蝶',
    image: 'images/butterfly.jpg',
    audio: 'audio/butterfly.wav',
    category: 'Animals'
  },
  {
    id: 2,
    word: 'cat',
    translation: '猫',
    image: 'images/cat.jpg',
    audio: 'audio/cat.wav',
    category: 'Animals'
  },
  {
    id: 3,
    word: 'dog',
    translation: '狗',
    image: 'images/dog.jpg',
    audio: 'audio/dog.wav',
    category: 'Animals'
  },
  {
    id: 4,
    word: 'elephant',
    translation: '大象',
    image: 'images/elephant.jpg',
    audio: 'audio/elephant.wav',
    category: 'Animals'
  },
  {
    id: 5,
    word: 'panda',
    translation: '熊猫',
    image: 'images/panda.jpg',
    audio: 'audio/panda.wav',
    category: 'Animals'
  },
  {
    id: 6,
    word: 'rabbit',
    translation: '兔子',
    image: 'images/rabbit.jpg',
    audio: 'audio/rabbit.wav',
    category: 'Animals'
  },
  // 如果没有实际图片和音频，可以使用占位符
  {
    id: 7,
    word: 'apple',
    translation: '苹果',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    audio: '',
    category: 'Food'
  },
  {
    id: 8,
    word: 'banana',
    translation: '香蕉',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
    audio: '',
    category: 'Food'
  },
  {
    id: 9,
    word: 'car',
    translation: '汽车',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400',
    audio: '',
    category: 'Transportation'
  },
  {
    id: 10,
    word: 'bicycle',
    translation: '自行车',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    audio: '',
    category: 'Transportation'
  },
  {
    id: 11,
    word: 'sun',
    translation: '太阳',
    image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400',
    audio: '',
    category: 'Nature'
  },
  {
    id: 12,
    word: 'moon',
    translation: '月亮',
    image: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400',
    audio: '',
    category: 'Nature'
  },
  {
    id: 13,
    word: 'flower',
    translation: '花',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400',
    audio: '',
    category: 'Nature'
  },
  {
    id: 14,
    word: 'tree',
    translation: '树',
    image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400',
    audio: '',
    category: 'Nature'
  },
  {
    id: 15,
    word: 'book',
    translation: '书',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    audio: '',
    category: 'Education'
  },
  {
    id: 16,
    word: 'pencil',
    translation: '铅笔',
    image: 'https://images.unsplash.com/photo-1589380160104-6d4f5377f63c?w=400',
    audio: '',
    category: 'Education'
  },
  {
    id: 17,
    word: 'house',
    translation: '房子',
    image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=400',
    audio: '',
    category: 'Buildings'
  },
  {
    id: 18,
    word: 'mountain',
    translation: '山',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    audio: '',
    category: 'Nature'
  },
  {
    id: 19,
    word: 'ocean',
    translation: '海洋',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
    audio: '',
    category: 'Nature'
  },
  {
    id: 20,
    word: 'smile',
    translation: '微笑',
    image: 'https://images.unsplash.com/photo-1497316730643-415fac54a2af?w=400',
    audio: '',
    category: 'Emotions'
  }
];

// 从本地存储加载自定义卡片
const customCards = JSON.parse(localStorage.getItem('customCards') || '[]');
if (customCards.length > 0) {
  cardData.push(...customCards.filter(card => !cardData.find(c => c.id === card.id)));
}