/**
 * Initial question bank used to seed the database on first deploy.
 * Each word entry carries pinyin AND zhuyin (注音符號).
 * Target: at least 10 questions per topic.
 */

// Shared word table — single source of truth for all phonetic data
const W = {
  // Animals
  cat:        { chinese: '貓',       pinyin: 'māo',       zhuyin: 'ㄇㄠ',           english: 'cat' },
  dog:        { chinese: '狗',       pinyin: 'gǒu',       zhuyin: 'ㄍㄡˇ',          english: 'dog' },
  bird:       { chinese: '鳥',       pinyin: 'niǎo',      zhuyin: 'ㄋㄧㄠˇ',         english: 'bird' },
  fish:       { chinese: '魚',       pinyin: 'yú',        zhuyin: 'ㄩˊ',            english: 'fish' },
  horse:      { chinese: '馬',       pinyin: 'mǎ',        zhuyin: 'ㄇㄚˇ',          english: 'horse' },
  cow:        { chinese: '牛',       pinyin: 'niú',       zhuyin: 'ㄋㄧㄡˊ',         english: 'cow' },
  sheep:      { chinese: '羊',       pinyin: 'yáng',      zhuyin: 'ㄧㄤˊ',          english: 'sheep' },
  pig:        { chinese: '豬',       pinyin: 'zhū',       zhuyin: 'ㄓㄨ',           english: 'pig' },
  rabbit:     { chinese: '兔子',     pinyin: 'tùzi',      zhuyin: 'ㄊㄨˋ ˙ㄗ',       english: 'rabbit' },
  chicken:    { chinese: '雞',       pinyin: 'jī',        zhuyin: 'ㄐㄧ',           english: 'chicken' },

  // Food
  rice:       { chinese: '米飯',     pinyin: 'mǐfàn',     zhuyin: 'ㄇㄧˇ ㄈㄢˋ',     english: 'rice' },
  noodles:    { chinese: '麵條',     pinyin: 'miàntiáo',  zhuyin: 'ㄇㄧㄢˋ ㄊㄧㄠˊ',  english: 'noodles' },
  apple:      { chinese: '蘋果',     pinyin: 'píngguǒ',   zhuyin: 'ㄆㄧㄥˊ ㄍㄨㄛˇ',  english: 'apple' },
  egg:        { chinese: '雞蛋',     pinyin: 'jīdàn',     zhuyin: 'ㄐㄧ ㄉㄢˋ',      english: 'egg' },
  water:      { chinese: '水',       pinyin: 'shuǐ',      zhuyin: 'ㄕㄨㄟˇ',         english: 'water' },
  milk:       { chinese: '牛奶',     pinyin: 'niúnǎi',    zhuyin: 'ㄋㄧㄡˊ ㄋㄞˇ',   english: 'milk' },
  tea:        { chinese: '茶',       pinyin: 'chá',       zhuyin: 'ㄔㄚˊ',          english: 'tea' },
  banana:     { chinese: '香蕉',     pinyin: 'xiāngjiāo', zhuyin: 'ㄒㄧㄤ ㄐㄧㄠ',    english: 'banana' },
  bread:      { chinese: '麵包',     pinyin: 'miànbāo',   zhuyin: 'ㄇㄧㄢˋ ㄅㄠ',    english: 'bread' },
  soup:       { chinese: '湯',       pinyin: 'tāng',      zhuyin: 'ㄊㄤ',           english: 'soup' },

  // Family
  mom:        { chinese: '媽媽',     pinyin: 'māmā',      zhuyin: 'ㄇㄚ ㄇㄚ',       english: 'mom' },
  dad:        { chinese: '爸爸',     pinyin: 'bàbà',      zhuyin: 'ㄅㄚˋ ㄅㄚˋ',     english: 'dad' },
  teacher:    { chinese: '老師',     pinyin: 'lǎoshī',    zhuyin: 'ㄌㄠˇ ㄕ',        english: 'teacher' },
  friend:     { chinese: '朋友',     pinyin: 'péngyǒu',   zhuyin: 'ㄆㄥˊ ㄧㄡˇ',     english: 'friend' },
  brother:    { chinese: '哥哥',     pinyin: 'gēge',      zhuyin: 'ㄍㄜ ˙ㄍㄜ',     english: 'older brother' },
  sister:     { chinese: '姐姐',     pinyin: 'jiějie',    zhuyin: 'ㄐㄧㄝˇ ˙ㄐㄧㄝ', english: 'older sister' },
  littleBro:  { chinese: '弟弟',     pinyin: 'dìdi',      zhuyin: 'ㄉㄧˋ ˙ㄉㄧ',    english: 'younger brother' },
  littleSis:  { chinese: '妹妹',     pinyin: 'mèimei',    zhuyin: 'ㄇㄟˋ ˙ㄇㄟ',    english: 'younger sister' },
  grandma:    { chinese: '奶奶',     pinyin: 'nǎinai',    zhuyin: 'ㄋㄞˇ ˙ㄋㄞ',    english: 'grandma' },
  grandpa:    { chinese: '爺爺',     pinyin: 'yéye',      zhuyin: 'ㄧㄝˊ ˙ㄧㄝ',    english: 'grandpa' },

  // Greetings
  hello:      { chinese: '你好',     pinyin: 'nǐhǎo',     zhuyin: 'ㄋㄧˇ ㄏㄠˇ',     english: 'hello' },
  thanks:     { chinese: '謝謝',     pinyin: 'xièxiè',    zhuyin: 'ㄒㄧㄝˋ ㄒㄧㄝˋ',  english: 'thank you' },
  goodbye:    { chinese: '再見',     pinyin: 'zàijiàn',   zhuyin: 'ㄗㄞˋ ㄐㄧㄢˋ',   english: 'goodbye' },
  sorry:      { chinese: '對不起',   pinyin: 'duìbuqǐ',   zhuyin: 'ㄉㄨㄟˋ ˙ㄅㄨ ㄑㄧˇ', english: 'sorry' },
  welcome:    { chinese: '不客氣',   pinyin: 'bùkèqì',    zhuyin: 'ㄅㄨˊ ㄎㄜˋ ㄑㄧˋ', english: "you're welcome" },
  goodMorn:   { chinese: '早安',     pinyin: 'zǎo\'ān',   zhuyin: 'ㄗㄠˇ ㄢ',       english: 'good morning' },
  goodNight:  { chinese: '晚安',     pinyin: 'wǎn\'ān',   zhuyin: 'ㄨㄢˇ ㄢ',       english: 'good night' },
  noWorries:  { chinese: '沒關係',   pinyin: 'méiguānxi', zhuyin: 'ㄇㄟˊ ㄍㄨㄢ ˙ㄒㄧ', english: 'no problem' },
  please:     { chinese: '請',       pinyin: 'qǐng',      zhuyin: 'ㄑㄧㄥˇ',         english: 'please' },
  iLoveYou:   { chinese: '我愛你',   pinyin: 'wǒ ài nǐ',  zhuyin: 'ㄨㄛˇ ㄞˋ ㄋㄧˇ', english: 'I love you' },

  // Numbers
  one:        { chinese: '一',       pinyin: 'yī',        zhuyin: 'ㄧ',            english: 'one' },
  two:        { chinese: '二',       pinyin: 'èr',        zhuyin: 'ㄦˋ',           english: 'two' },
  three:      { chinese: '三',       pinyin: 'sān',       zhuyin: 'ㄙㄢ',           english: 'three' },
  four:       { chinese: '四',       pinyin: 'sì',        zhuyin: 'ㄙˋ',           english: 'four' },
  five:       { chinese: '五',       pinyin: 'wǔ',        zhuyin: 'ㄨˇ',           english: 'five' },
  six:        { chinese: '六',       pinyin: 'liù',       zhuyin: 'ㄌㄧㄡˋ',        english: 'six' },
  seven:      { chinese: '七',       pinyin: 'qī',        zhuyin: 'ㄑㄧ',           english: 'seven' },
  eight:      { chinese: '八',       pinyin: 'bā',        zhuyin: 'ㄅㄚ',           english: 'eight' },
  nine:       { chinese: '九',       pinyin: 'jiǔ',       zhuyin: 'ㄐㄧㄡˇ',        english: 'nine' },
  ten:        { chinese: '十',       pinyin: 'shí',       zhuyin: 'ㄕˊ',           english: 'ten' },

  // Daily Life
  school:     { chinese: '學校',     pinyin: 'xuéxiào',   zhuyin: 'ㄒㄩㄝˊ ㄒㄧㄠˋ', english: 'school' },
  home:       { chinese: '家',       pinyin: 'jiā',       zhuyin: 'ㄐㄧㄚ',          english: 'home' },
  hospital:   { chinese: '醫院',     pinyin: 'yīyuàn',    zhuyin: 'ㄧ ㄩㄢˋ',        english: 'hospital' },
  bookstore:  { chinese: '書店',     pinyin: 'shūdiàn',   zhuyin: 'ㄕㄨ ㄉㄧㄢˋ',    english: 'bookstore' },
  book:       { chinese: '書',       pinyin: 'shū',       zhuyin: 'ㄕㄨ',           english: 'book' },
  table:      { chinese: '桌子',     pinyin: 'zhuōzi',    zhuyin: 'ㄓㄨㄛ ˙ㄗ',     english: 'table' },
  chair:      { chinese: '椅子',     pinyin: 'yǐzi',      zhuyin: 'ㄧˇ ˙ㄗ',       english: 'chair' },
  bed:        { chinese: '床',       pinyin: 'chuáng',    zhuyin: 'ㄔㄨㄤˊ',        english: 'bed' },
  door:       { chinese: '門',       pinyin: 'mén',       zhuyin: 'ㄇㄣˊ',          english: 'door' },
  window:     { chinese: '窗戶',     pinyin: 'chuānghu',  zhuyin: 'ㄔㄨㄤ ˙ㄏㄨ',   english: 'window' }
};

// Helper to build a question concisely.
// Only image_to_word questions keep the emoji — for the other types the
// visual is never shown, so we drop it at the source to keep the bank tidy.
function Q(id, topic, type, emoji, question_en, ansKey, optKeys) {
  return {
    id,
    topic,
    type,
    emoji: type === 'image_to_word' ? emoji : '',
    question_en,
    answer:  W[ansKey],
    options: optKeys.map(k => W[k]),
    correctIndex: 0,
    createdAt: '2026-05-19T00:00:00.000Z'
  };
}

const seedQuestions = [
  /* ────── Animals (10) ────── */
  Q('seed-001', 'Animals', 'image_to_word',   '🐱', 'What is this animal?',         'cat',     ['cat','dog','bird','fish']),
  Q('seed-002', 'Animals', 'word_to_meaning', '🐶', 'What does this word mean?',    'dog',     ['dog','cat','horse','fish']),
  Q('seed-003', 'Animals', 'meaning_to_word', '🐦', "How do you say 'bird'?",        'bird',    ['bird','fish','cat','horse']),
  Q('seed-004', 'Animals', 'image_to_word',   '🐟', 'What is this?',                 'fish',    ['fish','cat','bird','dog']),
  Q('seed-005', 'Animals', 'image_to_word',   '🐴', 'What animal is this?',          'horse',   ['horse','cow','sheep','pig']),
  Q('seed-006', 'Animals', 'image_to_word',   '🐮', 'What farm animal is this?',     'cow',     ['cow','sheep','pig','horse']),
  Q('seed-007', 'Animals', 'word_to_meaning', '🐑', 'What does this word mean?',     'sheep',   ['sheep','cow','rabbit','pig']),
  Q('seed-008', 'Animals', 'meaning_to_word', '🐰', "How do you say 'rabbit'?",      'rabbit',  ['rabbit','pig','chicken','cat']),
  Q('seed-009', 'Animals', 'image_to_word',   '🐷', 'What animal is this?',          'pig',     ['pig','cow','rabbit','sheep']),
  Q('seed-010', 'Animals', 'meaning_to_word', '🐔', "How do you say 'chicken'?",     'chicken', ['chicken','bird','pig','cow']),

  /* ────── Food (10) ────── */
  Q('seed-011', 'Food', 'image_to_word',   '🍚', 'What food is this?',          'rice',     ['rice','noodles','apple','egg']),
  Q('seed-012', 'Food', 'word_to_meaning', '💧', 'What does this word mean?',   'water',    ['water','milk','tea','rice']),
  Q('seed-013', 'Food', 'image_to_word',   '🍎', 'What fruit is this?',         'apple',    ['apple','banana','egg','noodles']),
  Q('seed-014', 'Food', 'meaning_to_word', '🥛', "How do you say 'milk'?",       'milk',     ['milk','water','tea','apple']),
  Q('seed-015', 'Food', 'image_to_word',   '🍜', 'What food is this?',          'noodles',  ['noodles','rice','soup','bread']),
  Q('seed-016', 'Food', 'word_to_meaning', '🍌', 'What does this word mean?',   'banana',   ['banana','apple','milk','tea']),
  Q('seed-017', 'Food', 'image_to_word',   '🍞', 'What food is this?',          'bread',    ['bread','noodles','rice','soup']),
  Q('seed-018', 'Food', 'meaning_to_word', '🍵', "How do you say 'tea'?",        'tea',      ['tea','water','milk','soup']),
  Q('seed-019', 'Food', 'image_to_word',   '🍲', 'What food is this?',          'soup',     ['soup','noodles','rice','bread']),
  Q('seed-020', 'Food', 'image_to_word',   '🥚', 'What food is this?',          'egg',      ['egg','rice','bread','apple']),

  /* ────── Family (10) ────── */
  Q('seed-021', 'Family', 'image_to_word',   '👩', "Which word means 'mom'?",       'mom',       ['mom','dad','teacher','friend']),
  Q('seed-022', 'Family', 'word_to_meaning', '👨', 'What does this word mean?',     'dad',       ['dad','mom','friend','teacher']),
  Q('seed-023', 'Family', 'meaning_to_word', '👩‍🏫', "How do you say 'teacher'?",     'teacher',   ['teacher','friend','mom','dad']),
  Q('seed-024', 'Family', 'word_to_meaning', '👫', 'What does this word mean?',     'friend',    ['friend','teacher','brother','sister']),
  Q('seed-025', 'Family', 'image_to_word',   '👦', 'Which word means older brother?', 'brother', ['brother','littleBro','dad','sister']),
  Q('seed-026', 'Family', 'image_to_word',   '👧', 'Which word means older sister?', 'sister',   ['sister','littleSis','mom','brother']),
  Q('seed-027', 'Family', 'meaning_to_word', '🧒', "How do you say 'younger brother'?", 'littleBro', ['littleBro','brother','littleSis','friend']),
  Q('seed-028', 'Family', 'word_to_meaning', '👶', 'What does this word mean?',     'littleSis', ['littleSis','sister','mom','grandma']),
  Q('seed-029', 'Family', 'image_to_word',   '👵', 'Which word means grandma?',     'grandma',   ['grandma','grandpa','mom','sister']),
  Q('seed-030', 'Family', 'meaning_to_word', '👴', "How do you say 'grandpa'?",      'grandpa',   ['grandpa','grandma','dad','brother']),

  /* ────── Greetings (10) ────── */
  Q('seed-031', 'Greetings', 'word_to_meaning', '👋', 'What does this phrase mean?',  'hello',     ['hello','thanks','goodbye','sorry']),
  Q('seed-032', 'Greetings', 'meaning_to_word', '🙏', "How do you say 'thank you'?",   'thanks',    ['thanks','hello','goodbye','welcome']),
  Q('seed-033', 'Greetings', 'meaning_to_word', '👋', "How do you say 'goodbye'?",     'goodbye',   ['goodbye','hello','thanks','sorry']),
  Q('seed-034', 'Greetings', 'word_to_meaning', '😔', 'What does this phrase mean?',  'sorry',     ['sorry','thanks','hello','welcome']),
  Q('seed-035', 'Greetings', 'word_to_meaning', '😊', 'What does this phrase mean?',  'welcome',   ['welcome','sorry','please','noWorries']),
  Q('seed-036', 'Greetings', 'meaning_to_word', '🌅', "How do you say 'good morning'?", 'goodMorn',  ['goodMorn','goodNight','hello','please']),
  Q('seed-037', 'Greetings', 'word_to_meaning', '🌙', 'What does this phrase mean?',  'goodNight', ['goodNight','goodMorn','goodbye','sorry']),
  Q('seed-038', 'Greetings', 'meaning_to_word', '🙂', "How do you say 'no problem'?",  'noWorries', ['noWorries','welcome','sorry','please']),
  Q('seed-039', 'Greetings', 'word_to_meaning', '🤲', 'What does this word mean?',    'please',    ['please','thanks','sorry','welcome']),
  Q('seed-040', 'Greetings', 'meaning_to_word', '❤️', "How do you say 'I love you'?",   'iLoveYou',  ['iLoveYou','hello','thanks','please']),

  /* ────── Numbers (10) ────── */
  Q('seed-041', 'Numbers', 'image_to_word',   '1️⃣', 'What number is this?',     'one',   ['one','two','three','four']),
  Q('seed-042', 'Numbers', 'meaning_to_word', '2️⃣', "How do you say 'two'?",     'two',   ['two','one','three','five']),
  Q('seed-043', 'Numbers', 'word_to_meaning', '3️⃣', 'What does this number mean?', 'three', ['three','two','four','six']),
  Q('seed-044', 'Numbers', 'image_to_word',   '4️⃣', 'What number is this?',     'four',  ['four','three','five','six']),
  Q('seed-045', 'Numbers', 'meaning_to_word', '5️⃣', "How do you say 'five'?",    'five',  ['five','four','six','seven']),
  Q('seed-046', 'Numbers', 'word_to_meaning', '6️⃣', 'What does this number mean?', 'six',   ['six','five','seven','eight']),
  Q('seed-047', 'Numbers', 'image_to_word',   '7️⃣', 'What number is this?',     'seven', ['seven','six','eight','nine']),
  Q('seed-048', 'Numbers', 'meaning_to_word', '8️⃣', "How do you say 'eight'?",   'eight', ['eight','seven','nine','ten']),
  Q('seed-049', 'Numbers', 'word_to_meaning', '9️⃣', 'What does this number mean?', 'nine',  ['nine','eight','ten','seven']),
  Q('seed-050', 'Numbers', 'image_to_word',   '🔟', 'What number is this?',     'ten',   ['ten','nine','eight','seven']),

  /* ────── Daily Life (10) ────── */
  Q('seed-051', 'Daily Life', 'image_to_word',   '🏫', 'What place is this?',           'school',    ['school','home','hospital','bookstore']),
  Q('seed-052', 'Daily Life', 'image_to_word',   '📚', 'What is this?',                 'book',      ['book','school','table','chair']),
  Q('seed-053', 'Daily Life', 'word_to_meaning', '🏠', 'What does this word mean?',     'home',      ['home','school','hospital','bed']),
  Q('seed-054', 'Daily Life', 'meaning_to_word', '🏥', "How do you say 'hospital'?",     'hospital',  ['hospital','school','bookstore','home']),
  Q('seed-055', 'Daily Life', 'image_to_word',   '📖', 'What place sells these?',       'bookstore', ['bookstore','school','hospital','home']),
  Q('seed-056', 'Daily Life', 'meaning_to_word', '🪑', "How do you say 'chair'?",        'chair',     ['chair','table','bed','door']),
  Q('seed-057', 'Daily Life', 'word_to_meaning', '🟫', 'What does this word mean?',     'table',     ['table','chair','bed','window']),
  Q('seed-058', 'Daily Life', 'image_to_word',   '🛏️', 'What furniture is this?',       'bed',       ['bed','chair','table','door']),
  Q('seed-059', 'Daily Life', 'meaning_to_word', '🚪', "How do you say 'door'?",         'door',      ['door','window','table','chair']),
  Q('seed-060', 'Daily Life', 'word_to_meaning', '🪟', 'What does this word mean?',     'window',    ['window','door','bed','table'])
];

module.exports = { seedQuestions };
