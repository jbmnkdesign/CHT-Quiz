/**
 * Initial question bank used to seed the database on first deploy.
 * Mirrors the original data/questions.json (Traditional Chinese, HSK1/TOCFL level).
 * Each word entry carries pinyin AND zhuyin (注音符號).
 */

// Shared word table — single source of truth for all phonetic data
const W = {
  cat:        { chinese: '貓',     pinyin: 'māo',       zhuyin: 'ㄇㄠ',           english: 'cat' },
  dog:        { chinese: '狗',     pinyin: 'gǒu',       zhuyin: 'ㄍㄡˇ',          english: 'dog' },
  bird:       { chinese: '鳥',     pinyin: 'niǎo',      zhuyin: 'ㄋㄧㄠˇ',         english: 'bird' },
  fish:       { chinese: '魚',     pinyin: 'yú',        zhuyin: 'ㄩˊ',            english: 'fish' },
  horse:      { chinese: '馬',     pinyin: 'mǎ',        zhuyin: 'ㄇㄚˇ',          english: 'horse' },
  rice:       { chinese: '米飯',   pinyin: 'mǐfàn',     zhuyin: 'ㄇㄧˇ ㄈㄢˋ',     english: 'rice' },
  noodles:    { chinese: '麵條',   pinyin: 'miàntiáo',  zhuyin: 'ㄇㄧㄢˋ ㄊㄧㄠˊ',  english: 'noodles' },
  apple:      { chinese: '蘋果',   pinyin: 'píngguǒ',   zhuyin: 'ㄆㄧㄥˊ ㄍㄨㄛˇ',  english: 'apple' },
  egg:        { chinese: '雞蛋',   pinyin: 'jīdàn',     zhuyin: 'ㄐㄧ ㄉㄢˋ',      english: 'egg' },
  water:      { chinese: '水',     pinyin: 'shuǐ',      zhuyin: 'ㄕㄨㄟˇ',         english: 'water' },
  milk:       { chinese: '牛奶',   pinyin: 'niúnǎi',    zhuyin: 'ㄋㄧㄡˊ ㄋㄞˇ',   english: 'milk' },
  tea:        { chinese: '茶',     pinyin: 'chá',       zhuyin: 'ㄔㄚˊ',          english: 'tea' },
  mom:        { chinese: '媽媽',   pinyin: 'māmā',      zhuyin: 'ㄇㄚ ㄇㄚ',       english: 'mom' },
  dad:        { chinese: '爸爸',   pinyin: 'bàbà',      zhuyin: 'ㄅㄚˋ ㄅㄚˋ',     english: 'dad' },
  teacher:    { chinese: '老師',   pinyin: 'lǎoshī',    zhuyin: 'ㄌㄠˇ ㄕ',        english: 'teacher' },
  friend:     { chinese: '朋友',   pinyin: 'péngyǒu',   zhuyin: 'ㄆㄥˊ ㄧㄡˇ',     english: 'friend' },
  hello:      { chinese: '你好',   pinyin: 'nǐhǎo',     zhuyin: 'ㄋㄧˇ ㄏㄠˇ',     english: 'hello' },
  thanks:     { chinese: '謝謝',   pinyin: 'xièxiè',    zhuyin: 'ㄒㄧㄝˋ ㄒㄧㄝˋ',  english: 'thank you' },
  goodbye:    { chinese: '再見',   pinyin: 'zàijiàn',   zhuyin: 'ㄗㄞˋ ㄐㄧㄢˋ',   english: 'goodbye' },
  sorry:      { chinese: '對不起', pinyin: 'duìbuqǐ',   zhuyin: 'ㄉㄨㄟˋ ˙ㄅㄨ ㄑㄧˇ', english: 'sorry' },
  welcome:    { chinese: '不客氣', pinyin: 'bùkèqì',    zhuyin: 'ㄅㄨˊ ㄎㄜˋ ㄑㄧˋ', english: "you're welcome" },
  one:        { chinese: '一',     pinyin: 'yī',        zhuyin: 'ㄧ',            english: 'one' },
  two:        { chinese: '二',     pinyin: 'èr',        zhuyin: 'ㄦˋ',           english: 'two' },
  three:      { chinese: '三',     pinyin: 'sān',       zhuyin: 'ㄙㄢ',           english: 'three' },
  four:       { chinese: '四',     pinyin: 'sì',        zhuyin: 'ㄙˋ',           english: 'four' },
  five:       { chinese: '五',     pinyin: 'wǔ',        zhuyin: 'ㄨˇ',           english: 'five' },
  six:        { chinese: '六',     pinyin: 'liù',       zhuyin: 'ㄌㄧㄡˋ',        english: 'six' },
  school:     { chinese: '學校',   pinyin: 'xuéxiào',   zhuyin: 'ㄒㄩㄝˊ ㄒㄧㄠˋ', english: 'school' },
  home:       { chinese: '家',     pinyin: 'jiā',       zhuyin: 'ㄐㄧㄚ',          english: 'home' },
  hospital:   { chinese: '醫院',   pinyin: 'yīyuàn',    zhuyin: 'ㄧ ㄩㄢˋ',        english: 'hospital' },
  bookstore:  { chinese: '書店',   pinyin: 'shūdiàn',   zhuyin: 'ㄕㄨ ㄉㄧㄢˋ',    english: 'bookstore' },
  book:       { chinese: '書',     pinyin: 'shū',       zhuyin: 'ㄕㄨ',           english: 'book' },
  table:      { chinese: '桌子',   pinyin: 'zhuōzi',    zhuyin: 'ㄓㄨㄛ ˙ㄗ',     english: 'table' },
  chair:      { chinese: '椅子',   pinyin: 'yǐzi',      zhuyin: 'ㄧˇ ˙ㄗ',       english: 'chair' }
};

const seedQuestions = [
  // Animals
  { id: 'seed-001', topic: 'Animals', type: 'image_to_word',   emoji: '🐱',
    question_en: 'What is this animal?',
    answer: W.cat,
    options: [W.cat, W.dog, W.bird, W.fish],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-002', topic: 'Animals', type: 'word_to_meaning', emoji: '🐶',
    question_en: 'What does this word mean?',
    answer: W.dog,
    options: [W.dog, W.cat, W.horse, W.fish],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-003', topic: 'Animals', type: 'meaning_to_word', emoji: '🐦',
    question_en: "How do you say 'bird' in Chinese?",
    answer: W.bird,
    options: [W.bird, W.fish, W.cat, W.horse],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-004', topic: 'Animals', type: 'image_to_word',   emoji: '🐟',
    question_en: 'What is this?',
    answer: W.fish,
    options: [W.fish, W.cat, W.bird, W.dog],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  // Food
  { id: 'seed-005', topic: 'Food', type: 'image_to_word',   emoji: '🍚',
    question_en: 'What food is this?',
    answer: W.rice,
    options: [W.rice, W.noodles, W.apple, W.egg],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-006', topic: 'Food', type: 'word_to_meaning', emoji: '💧',
    question_en: 'What does this word mean?',
    answer: W.water,
    options: [W.water, W.milk, W.tea, W.rice],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-007', topic: 'Food', type: 'image_to_word',   emoji: '🍎',
    question_en: 'What fruit is this?',
    answer: W.apple,
    options: [W.apple, W.rice, W.egg, W.noodles],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-008', topic: 'Food', type: 'meaning_to_word', emoji: '🥛',
    question_en: "How do you say 'milk' in Chinese?",
    answer: W.milk,
    options: [W.milk, W.water, W.tea, W.apple],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  // Family
  { id: 'seed-009', topic: 'Family', type: 'image_to_word',   emoji: '👩',
    question_en: "Which word means 'mom'?",
    answer: W.mom,
    options: [W.mom, W.dad, W.teacher, W.friend],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-010', topic: 'Family', type: 'word_to_meaning', emoji: '👨',
    question_en: 'What does this word mean?',
    answer: W.dad,
    options: [W.dad, W.mom, W.friend, W.teacher],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-011', topic: 'Family', type: 'meaning_to_word', emoji: '👩‍🏫',
    question_en: "How do you say 'teacher' in Chinese?",
    answer: W.teacher,
    options: [W.teacher, W.friend, W.mom, W.dad],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  // Greetings
  { id: 'seed-012', topic: 'Greetings', type: 'word_to_meaning', emoji: '👋',
    question_en: 'What does this phrase mean?',
    answer: W.hello,
    options: [W.hello, W.thanks, W.goodbye, W.sorry],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-013', topic: 'Greetings', type: 'meaning_to_word', emoji: '🙏',
    question_en: "How do you say 'thank you' in Chinese?",
    answer: W.thanks,
    options: [W.thanks, W.hello, W.goodbye, W.welcome],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-014', topic: 'Greetings', type: 'meaning_to_word', emoji: '👋',
    question_en: "How do you say 'goodbye' in Chinese?",
    answer: W.goodbye,
    options: [W.goodbye, W.hello, W.thanks, W.sorry],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-015', topic: 'Greetings', type: 'word_to_meaning', emoji: '😔',
    question_en: 'What does this phrase mean?',
    answer: W.sorry,
    options: [W.sorry, W.thanks, W.hello, W.welcome],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  // Numbers
  { id: 'seed-016', topic: 'Numbers', type: 'image_to_word',   emoji: '1️⃣',
    question_en: 'What number is this?',
    answer: W.one,
    options: [W.one, W.two, W.three, W.four],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-017', topic: 'Numbers', type: 'meaning_to_word', emoji: '2️⃣',
    question_en: "How do you say 'two' in Chinese?",
    answer: W.two,
    options: [W.two, W.one, W.three, W.five],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-018', topic: 'Numbers', type: 'word_to_meaning', emoji: '3️⃣',
    question_en: 'What does this number mean?',
    answer: W.three,
    options: [W.three, W.two, W.four, W.six],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  // Daily Life
  { id: 'seed-019', topic: 'Daily Life', type: 'image_to_word', emoji: '🏫',
    question_en: 'What place is this?',
    answer: W.school,
    options: [W.school, W.home, W.hospital, W.bookstore],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' },

  { id: 'seed-020', topic: 'Daily Life', type: 'image_to_word', emoji: '📚',
    question_en: 'What is this?',
    answer: W.book,
    options: [W.book, W.school, W.table, W.chair],
    correctIndex: 0, createdAt: '2026-05-19T00:00:00.000Z' }
];

module.exports = { seedQuestions };
