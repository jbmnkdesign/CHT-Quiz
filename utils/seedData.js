/**
 * Initial question bank used to seed the database on first deploy.
 * Mirrors the original data/questions.json (Traditional Chinese, HSK1/TOCFL level).
 */
const seedQuestions = [
  {
    id: "seed-001",
    topic: "Animals",
    type: "image_to_word",
    emoji: "🐱",
    question_en: "What is this animal?",
    answer: { chinese: "貓", pinyin: "māo", english: "cat" },
    options: [
      { chinese: "貓", pinyin: "māo", english: "cat" },
      { chinese: "狗", pinyin: "gǒu", english: "dog" },
      { chinese: "鳥", pinyin: "niǎo", english: "bird" },
      { chinese: "魚", pinyin: "yú", english: "fish" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-002",
    topic: "Animals",
    type: "word_to_meaning",
    emoji: "🐶",
    question_en: "What does this word mean?",
    answer: { chinese: "狗", pinyin: "gǒu", english: "dog" },
    options: [
      { chinese: "狗", pinyin: "gǒu", english: "dog" },
      { chinese: "貓", pinyin: "māo", english: "cat" },
      { chinese: "馬", pinyin: "mǎ", english: "horse" },
      { chinese: "魚", pinyin: "yú", english: "fish" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-003",
    topic: "Animals",
    type: "meaning_to_word",
    emoji: "🐦",
    question_en: "How do you say 'bird' in Chinese?",
    answer: { chinese: "鳥", pinyin: "niǎo", english: "bird" },
    options: [
      { chinese: "鳥", pinyin: "niǎo", english: "bird" },
      { chinese: "魚", pinyin: "yú", english: "fish" },
      { chinese: "貓", pinyin: "māo", english: "cat" },
      { chinese: "馬", pinyin: "mǎ", english: "horse" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-004",
    topic: "Animals",
    type: "image_to_word",
    emoji: "🐟",
    question_en: "What is this?",
    answer: { chinese: "魚", pinyin: "yú", english: "fish" },
    options: [
      { chinese: "魚", pinyin: "yú", english: "fish" },
      { chinese: "貓", pinyin: "māo", english: "cat" },
      { chinese: "鳥", pinyin: "niǎo", english: "bird" },
      { chinese: "狗", pinyin: "gǒu", english: "dog" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-005",
    topic: "Food",
    type: "image_to_word",
    emoji: "🍚",
    question_en: "What food is this?",
    answer: { chinese: "米飯", pinyin: "mǐfàn", english: "rice" },
    options: [
      { chinese: "米飯", pinyin: "mǐfàn", english: "rice" },
      { chinese: "麵條", pinyin: "miàntiáo", english: "noodles" },
      { chinese: "蘋果", pinyin: "píngguǒ", english: "apple" },
      { chinese: "雞蛋", pinyin: "jīdàn", english: "egg" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-006",
    topic: "Food",
    type: "word_to_meaning",
    emoji: "💧",
    question_en: "What does this word mean?",
    answer: { chinese: "水", pinyin: "shuǐ", english: "water" },
    options: [
      { chinese: "水", pinyin: "shuǐ", english: "water" },
      { chinese: "牛奶", pinyin: "niúnǎi", english: "milk" },
      { chinese: "茶", pinyin: "chá", english: "tea" },
      { chinese: "米飯", pinyin: "mǐfàn", english: "rice" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-007",
    topic: "Food",
    type: "image_to_word",
    emoji: "🍎",
    question_en: "What fruit is this?",
    answer: { chinese: "蘋果", pinyin: "píngguǒ", english: "apple" },
    options: [
      { chinese: "蘋果", pinyin: "píngguǒ", english: "apple" },
      { chinese: "米飯", pinyin: "mǐfàn", english: "rice" },
      { chinese: "雞蛋", pinyin: "jīdàn", english: "egg" },
      { chinese: "麵條", pinyin: "miàntiáo", english: "noodles" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-008",
    topic: "Food",
    type: "meaning_to_word",
    emoji: "🥛",
    question_en: "How do you say 'milk' in Chinese?",
    answer: { chinese: "牛奶", pinyin: "niúnǎi", english: "milk" },
    options: [
      { chinese: "牛奶", pinyin: "niúnǎi", english: "milk" },
      { chinese: "水", pinyin: "shuǐ", english: "water" },
      { chinese: "茶", pinyin: "chá", english: "tea" },
      { chinese: "蘋果", pinyin: "píngguǒ", english: "apple" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-009",
    topic: "Family",
    type: "image_to_word",
    emoji: "👩",
    question_en: "Which word means 'mom'?",
    answer: { chinese: "媽媽", pinyin: "māmā", english: "mom" },
    options: [
      { chinese: "媽媽", pinyin: "māmā", english: "mom" },
      { chinese: "爸爸", pinyin: "bàbà", english: "dad" },
      { chinese: "老師", pinyin: "lǎoshī", english: "teacher" },
      { chinese: "朋友", pinyin: "péngyǒu", english: "friend" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-010",
    topic: "Family",
    type: "word_to_meaning",
    emoji: "👨",
    question_en: "What does this word mean?",
    answer: { chinese: "爸爸", pinyin: "bàbà", english: "dad" },
    options: [
      { chinese: "爸爸", pinyin: "bàbà", english: "dad" },
      { chinese: "媽媽", pinyin: "māmā", english: "mom" },
      { chinese: "朋友", pinyin: "péngyǒu", english: "friend" },
      { chinese: "老師", pinyin: "lǎoshī", english: "teacher" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-011",
    topic: "Family",
    type: "meaning_to_word",
    emoji: "👩‍🏫",
    question_en: "How do you say 'teacher' in Chinese?",
    answer: { chinese: "老師", pinyin: "lǎoshī", english: "teacher" },
    options: [
      { chinese: "老師", pinyin: "lǎoshī", english: "teacher" },
      { chinese: "朋友", pinyin: "péngyǒu", english: "friend" },
      { chinese: "媽媽", pinyin: "māmā", english: "mom" },
      { chinese: "爸爸", pinyin: "bàbà", english: "dad" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-012",
    topic: "Greetings",
    type: "word_to_meaning",
    emoji: "👋",
    question_en: "What does this phrase mean?",
    answer: { chinese: "你好", pinyin: "nǐhǎo", english: "hello" },
    options: [
      { chinese: "你好", pinyin: "nǐhǎo", english: "hello" },
      { chinese: "謝謝", pinyin: "xièxiè", english: "thank you" },
      { chinese: "再見", pinyin: "zàijiàn", english: "goodbye" },
      { chinese: "對不起", pinyin: "duìbuqǐ", english: "sorry" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-013",
    topic: "Greetings",
    type: "meaning_to_word",
    emoji: "🙏",
    question_en: "How do you say 'thank you' in Chinese?",
    answer: { chinese: "謝謝", pinyin: "xièxiè", english: "thank you" },
    options: [
      { chinese: "謝謝", pinyin: "xièxiè", english: "thank you" },
      { chinese: "你好", pinyin: "nǐhǎo", english: "hello" },
      { chinese: "再見", pinyin: "zàijiàn", english: "goodbye" },
      { chinese: "不客氣", pinyin: "bùkèqì", english: "you're welcome" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-014",
    topic: "Greetings",
    type: "image_to_word",
    emoji: "🤚",
    question_en: "Which phrase means 'goodbye'?",
    answer: { chinese: "再見", pinyin: "zàijiàn", english: "goodbye" },
    options: [
      { chinese: "再見", pinyin: "zàijiàn", english: "goodbye" },
      { chinese: "你好", pinyin: "nǐhǎo", english: "hello" },
      { chinese: "謝謝", pinyin: "xièxiè", english: "thank you" },
      { chinese: "對不起", pinyin: "duìbuqǐ", english: "sorry" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-015",
    topic: "Greetings",
    type: "word_to_meaning",
    emoji: "😔",
    question_en: "What does this phrase mean?",
    answer: { chinese: "對不起", pinyin: "duìbuqǐ", english: "sorry" },
    options: [
      { chinese: "對不起", pinyin: "duìbuqǐ", english: "sorry" },
      { chinese: "謝謝", pinyin: "xièxiè", english: "thank you" },
      { chinese: "你好", pinyin: "nǐhǎo", english: "hello" },
      { chinese: "不客氣", pinyin: "bùkèqì", english: "you're welcome" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-016",
    topic: "Numbers",
    type: "image_to_word",
    emoji: "1️⃣",
    question_en: "What number is this?",
    answer: { chinese: "一", pinyin: "yī", english: "one" },
    options: [
      { chinese: "一", pinyin: "yī", english: "one" },
      { chinese: "二", pinyin: "èr", english: "two" },
      { chinese: "三", pinyin: "sān", english: "three" },
      { chinese: "四", pinyin: "sì", english: "four" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-017",
    topic: "Numbers",
    type: "meaning_to_word",
    emoji: "2️⃣",
    question_en: "How do you say 'two' in Chinese?",
    answer: { chinese: "二", pinyin: "èr", english: "two" },
    options: [
      { chinese: "二", pinyin: "èr", english: "two" },
      { chinese: "一", pinyin: "yī", english: "one" },
      { chinese: "三", pinyin: "sān", english: "three" },
      { chinese: "五", pinyin: "wǔ", english: "five" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-018",
    topic: "Numbers",
    type: "word_to_meaning",
    emoji: "3️⃣",
    question_en: "What does this number mean?",
    answer: { chinese: "三", pinyin: "sān", english: "three" },
    options: [
      { chinese: "三", pinyin: "sān", english: "three" },
      { chinese: "二", pinyin: "èr", english: "two" },
      { chinese: "四", pinyin: "sì", english: "four" },
      { chinese: "六", pinyin: "liù", english: "six" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-019",
    topic: "Daily Life",
    type: "image_to_word",
    emoji: "🏫",
    question_en: "What place is this?",
    answer: { chinese: "學校", pinyin: "xuéxiào", english: "school" },
    options: [
      { chinese: "學校", pinyin: "xuéxiào", english: "school" },
      { chinese: "家", pinyin: "jiā", english: "home" },
      { chinese: "醫院", pinyin: "yīyuàn", english: "hospital" },
      { chinese: "書店", pinyin: "shūdiàn", english: "bookstore" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  },
  {
    id: "seed-020",
    topic: "Daily Life",
    type: "image_to_word",
    emoji: "📚",
    question_en: "What is this?",
    answer: { chinese: "書", pinyin: "shū", english: "book" },
    options: [
      { chinese: "書", pinyin: "shū", english: "book" },
      { chinese: "學校", pinyin: "xuéxiào", english: "school" },
      { chinese: "桌子", pinyin: "zhuōzi", english: "table" },
      { chinese: "椅子", pinyin: "yǐzi", english: "chair" }
    ],
    correctIndex: 0,
    createdAt: "2026-05-19T00:00:00.000Z"
  }
];

module.exports = { seedQuestions };
