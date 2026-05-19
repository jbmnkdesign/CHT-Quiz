/* ─── State ─── */
const state = {
  studentName: '',
  topic: 'all',
  questionCount: 10,
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  startTime: null,
  questionStartTime: null
};

/* ─── DOM References ─── */
const screens = {
  welcome: document.getElementById('welcome-screen'),
  quiz:    document.getElementById('quiz-screen'),
  results: document.getElementById('results-screen')
};

const nameInput      = document.getElementById('student-name');
const topicSelect    = document.getElementById('topic-select');
const countSelect    = document.getElementById('count-select');
const startBtn       = document.getElementById('start-btn');
const progressLabel  = document.getElementById('progress-label');
const scoreLabel     = document.getElementById('score-label');
const progressBar    = document.getElementById('progress-bar');
const questionVisual = document.getElementById('question-visual');
const questionText   = document.getElementById('question-text');
const feedbackBanner = document.getElementById('feedback-banner');
const optionsGrid    = document.getElementById('options-grid');
const nextBtn        = document.getElementById('next-btn');
const resultEmoji    = document.getElementById('result-emoji');
const resultMessage  = document.getElementById('result-message');
const scorePercent   = document.getElementById('score-percent');
const scoreDetail    = document.getElementById('score-detail');
const resultBreakdown = document.getElementById('result-breakdown');

/* ─── Init ─── */
async function init() {
  await loadTopics();

  nameInput.addEventListener('input', () => {
    startBtn.disabled = nameInput.value.trim().length === 0;
  });

  startBtn.addEventListener('click', startQuiz);
  nextBtn.addEventListener('click', nextQuestion);
  document.getElementById('retry-btn').addEventListener('click', retryQuiz);
  document.getElementById('change-topic-btn').addEventListener('click', () => showScreen('welcome'));
}

async function loadTopics() {
  try {
    const res  = await fetch('/api/quiz/topics');
    const topics = await res.json();
    topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = topicEmoji(t) + ' ' + t;
      topicSelect.appendChild(opt);
    });
  } catch {
    // Topics remain as just "All Topics" if API fails
  }
}

function topicEmoji(topic) {
  const map = {
    'Animals': '🐾', 'Food': '🍎', 'Family': '👨‍👩‍👧', 'Greetings': '👋',
    'Numbers': '🔢', 'Colors': '🎨', 'Daily Life': '🏫', 'Weather': '⛅',
    'Body': '💪', 'Clothes': '👕', 'School': '✏️', 'Transport': '🚌'
  };
  return map[topic] || '📖';
}

/* ─── Quiz Flow ─── */
async function startQuiz() {
  state.studentName    = nameInput.value.trim();
  state.topic          = topicSelect.value;
  state.questionCount  = parseInt(countSelect.value);
  state.currentIndex   = 0;
  state.answers        = [];
  state.score          = 0;
  state.startTime      = Date.now();

  try {
    const url = `/api/quiz/questions?topic=${encodeURIComponent(state.topic)}&limit=${state.questionCount}`;
    const res  = await fetch(url);
    const raw  = await res.json();

    if (!raw.length) {
      alert('No questions found for that topic. Please try another.');
      return;
    }

    state.questions = raw.map(q => shuffleOptions(q));
    showScreen('quiz');
    showQuestion(0);
  } catch {
    alert('Could not load questions. Please make sure the server is running.');
  }
}

function showQuestion(index) {
  const q = state.questions[index];
  state.questionStartTime = Date.now();

  progressLabel.textContent = `${index + 1} / ${state.questions.length}`;
  scoreLabel.textContent    = `Score: ${state.score}`;
  progressBar.style.width   = `${(index / state.questions.length) * 100}%`;

  feedbackBanner.className  = 'feedback-banner hidden';
  nextBtn.classList.add('hidden');

  // Question visual
  if (q.type === 'word_to_meaning') {
    questionVisual.innerHTML = `
      <div class="question-word-display">
        <span class="question-chinese-big">${q.answer.chinese}</span>
        <span class="question-pinyin-big">${q.answer.pinyin}</span>
      </div>`;
  } else if (q.type === 'meaning_to_word') {
    questionVisual.innerHTML = `
      <div class="question-word-display">
        <span class="question-chinese-big" style="font-size:2.2rem;color:#4A148C">
          ${q.answer.english}
        </span>
      </div>`;
  } else {
    questionVisual.innerHTML = `<span class="question-emoji">${q.emoji}</span>`;
  }

  questionText.textContent = q.question_en;

  // Build options
  optionsGrid.innerHTML = '';
  q.options.forEach((opt, i) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.innerHTML = `
      <span class="opt-pinyin">${opt.pinyin}</span>
      <span class="opt-chinese">${opt.chinese}</span>
      <span class="opt-english">${opt.english}</span>`;
    card.addEventListener('click', () => handleAnswer(i));
    optionsGrid.appendChild(card);
  });
}

function handleAnswer(selectedIndex) {
  if (optionsGrid.querySelector('.answered')) return;

  const q       = state.questions[state.currentIndex];
  const correct  = selectedIndex === q.correctIndex;
  const elapsed  = Math.round((Date.now() - state.questionStartTime) / 1000);

  if (correct) state.score++;

  state.answers.push({
    questionId:    q.id,
    topic:         q.topic,
    chinese:       q.answer.chinese,
    pinyin:        q.answer.pinyin,
    english:       q.answer.english,
    correct,
    timeTaken:     elapsed
  });

  // Style all cards
  const cards = optionsGrid.querySelectorAll('.option-card');
  cards.forEach((card, i) => {
    card.classList.add('answered');
    if (i === q.correctIndex)   card.classList.add(correct && i === selectedIndex ? 'selected-correct' : 'reveal-correct');
    if (i === selectedIndex && !correct) card.classList.add('selected-wrong');
  });

  // Feedback
  feedbackBanner.className = 'feedback-banner ' + (correct ? 'correct' : 'wrong');
  feedbackBanner.textContent = correct
    ? `✅ Correct! ${q.answer.chinese} (${q.answer.pinyin}) = ${q.answer.english}`
    : `❌ The answer is: ${q.answer.chinese} (${q.answer.pinyin}) = ${q.answer.english}`;

  scoreLabel.textContent = `Score: ${state.score}`;
  nextBtn.classList.remove('hidden');
  nextBtn.textContent = state.currentIndex < state.questions.length - 1 ? 'Next ➡️' : 'See Results 🏆';
}

function nextQuestion() {
  state.currentIndex++;
  if (state.currentIndex < state.questions.length) {
    showQuestion(state.currentIndex);
  } else {
    showResults();
  }
}

async function showResults() {
  const duration  = Math.round((Date.now() - state.startTime) / 1000);
  const pct       = Math.round((state.score / state.questions.length) * 100);

  showScreen('results');

  // Score circle
  scorePercent.textContent = pct + '%';
  scoreDetail.textContent  = `${state.score} out of ${state.questions.length} correct`;

  // Emoji & message
  let emoji, msg;
  if (pct >= 90)      { emoji = '🌟'; msg = 'Excellent! 太棒了！'; }
  else if (pct >= 70) { emoji = '⭐'; msg = 'Great job! 很好！'; }
  else if (pct >= 50) { emoji = '👍'; msg = 'Good try! 不錯！'; }
  else                { emoji = '💪'; msg = 'Keep going! 繼續加油！'; }

  resultEmoji.textContent   = emoji;
  resultMessage.textContent = msg;

  // Breakdown
  resultBreakdown.innerHTML = '';
  state.answers.forEach(a => {
    const row = document.createElement('div');
    row.className = `breakdown-row ${a.correct ? 'correct-row' : 'wrong-row'}`;
    row.innerHTML = `
      <span class="bd-icon">${a.correct ? '✅' : '❌'}</span>
      <span class="bd-chinese">${a.chinese}</span>
      <div style="display:flex;flex-direction:column;gap:1px">
        <span class="bd-pinyin">${a.pinyin}</span>
        <span class="bd-english">${a.english}</span>
      </div>`;
    resultBreakdown.appendChild(row);
  });

  // Save results
  try {
    await fetch('/api/quiz/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: state.studentName,
        topic:       state.topic === 'all' ? 'Mixed' : state.topic,
        score:       state.score,
        total:       state.questions.length,
        answers:     state.answers,
        duration
      })
    });
  } catch {
    // Non-critical — results display even if save fails
  }
}

function retryQuiz() {
  startQuiz();
}

/* ─── Helpers ─── */
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

function shuffleOptions(question) {
  const correctOption = question.options[question.correctIndex];
  const shuffled      = [...question.options].sort(() => Math.random() - 0.5);
  const newCorrectIdx = shuffled.findIndex(o => o.chinese === correctOption.chinese);
  return { ...question, options: shuffled, correctIndex: newCorrectIdx };
}

/* ─── Start ─── */
init();
