/* ─── State ─── */
const state = {
  studentName: '',
  assignments: [],
  topic: 'all',
  topics: [],
  questionCount: 10,
  assignmentId: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  startTime: null,
  questionStartTime: null,
  breakdownFilter: 'all'
};

/* ─── DOM ─── */
const screens = {
  welcome: document.getElementById('welcome-screen'),
  picker:  document.getElementById('picker-screen'),
  quiz:    document.getElementById('quiz-screen'),
  results: document.getElementById('results-screen')
};

const nameInput        = document.getElementById('student-name');
const continueBtn      = document.getElementById('continue-btn');
const pickerName       = document.getElementById('picker-name');
const changeNameBtn    = document.getElementById('change-name-btn');
const assignmentSection= document.getElementById('assignment-section');
const assignmentList   = document.getElementById('assignment-list');
const topicSelect      = document.getElementById('topic-select');
const countSelect      = document.getElementById('count-select');
const startPracticeBtn = document.getElementById('start-practice-btn');

const progressLabel  = document.getElementById('progress-label');
const scoreLabel     = document.getElementById('score-label');
const progressBar    = document.getElementById('progress-bar');
const questionVisual = document.getElementById('question-visual');
const questionText   = document.getElementById('question-text');
const feedbackBanner = document.getElementById('feedback-banner');
const optionsGrid    = document.getElementById('options-grid');
const nextBtn        = document.getElementById('next-btn');

const resultTitle    = document.getElementById('result-title');
const scoreCircle    = document.getElementById('score-circle');
const scorePercent   = document.getElementById('score-percent');
const scoreDetail    = document.getElementById('score-detail');
const resultMessage  = document.getElementById('result-message');
const resultBreakdown = document.getElementById('result-breakdown');
const breakdownTabs  = document.querySelectorAll('#breakdown-tabs .nav-link');

/* ─── Init ─── */
async function init() {
  nameInput.addEventListener('input', () => {
    continueBtn.disabled = nameInput.value.trim().length === 0;
  });
  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !continueBtn.disabled) goToPicker();
  });

  continueBtn.addEventListener('click', goToPicker);
  changeNameBtn.addEventListener('click', () => showScreen('welcome'));
  startPracticeBtn.addEventListener('click', startFreePractice);
  nextBtn.addEventListener('click', nextQuestion);

  document.getElementById('retry-btn').addEventListener('click', retryQuiz);
  document.getElementById('back-btn').addEventListener('click', () => showScreen('picker'));

  breakdownTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      state.breakdownFilter = btn.dataset.bdTab;
      breakdownTabs.forEach(b => b.classList.toggle('active', b === btn));
      renderBreakdown();
    });
  });

  await loadTopics();
}

/* ─── Welcome → Picker ─── */
async function goToPicker() {
  const name = nameInput.value.trim();
  if (!name) return;
  state.studentName = name;
  pickerName.textContent = name;

  await loadAssignments(name);
  showScreen('picker');
}

async function loadAssignments(name) {
  try {
    const res = await fetch(`/api/quiz/assignment/${encodeURIComponent(name)}`);
    state.assignments = await res.json();
  } catch {
    state.assignments = [];
  }
  renderAssignments();
}

function renderAssignments() {
  if (!state.assignments || state.assignments.length === 0) {
    assignmentSection.classList.add('d-none');
    return;
  }

  assignmentSection.classList.remove('d-none');
  assignmentList.innerHTML = '';
  state.assignments.forEach(a => {
    const div = document.createElement('div');
    div.className = 'assignment-item';
    const date = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    div.innerHTML = `
      <div class="flex-grow-1">
        <div class="assignment-topics">${escapeHtml(a.topics.join(' · '))}</div>
        <div class="assignment-meta">${a.questionCount} questions · assigned ${date}${a.notes ? ' · ' + escapeHtml(a.notes) : ''}</div>
      </div>
      <span class="assignment-go">›</span>`;
    div.addEventListener('click', () => startAssignment(a));
    assignmentList.appendChild(div);
  });
}

/* ─── Topic dropdown for free practice ─── */
async function loadTopics() {
  try {
    const res = await fetch('/api/quiz/topics');
    state.topics = await res.json();
    state.topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      topicSelect.appendChild(opt);
    });
  } catch { /* silent */ }
}

/* ─── Launch quiz ─── */
async function startAssignment(assignment) {
  state.topic = assignment.topics.join(',');
  state.questionCount = assignment.questionCount || 10;
  state.assignmentId = assignment.id;
  await launchQuiz();
}

async function startFreePractice() {
  state.topic = topicSelect.value;
  state.questionCount = parseInt(countSelect.value);
  state.assignmentId = null;
  await launchQuiz();
}

async function launchQuiz() {
  state.currentIndex = 0;
  state.answers = [];
  state.score = 0;
  state.startTime = Date.now();

  try {
    const url = `/api/quiz/questions?topic=${encodeURIComponent(state.topic)}&limit=${state.questionCount}`;
    const res = await fetch(url);
    const raw = await res.json();

    if (!raw.length) {
      alert('No questions found for that topic.');
      return;
    }

    state.questions = raw.map(shuffleOptions);
    showScreen('quiz');
    showQuestion(0);
  } catch {
    alert('Could not load questions. Please try again.');
  }
}

/* ─── Question rendering ─── */
function showQuestion(index) {
  const q = state.questions[index];
  state.questionStartTime = Date.now();

  progressLabel.textContent = `${index + 1} / ${state.questions.length}`;
  scoreLabel.textContent    = `Score ${state.score}`;
  progressBar.style.width   = `${(index / state.questions.length) * 100}%`;

  feedbackBanner.className = 'feedback-banner d-none';
  nextBtn.classList.add('d-none');

  if (q.type === 'word_to_meaning') {
    questionVisual.innerHTML = `
      <div class="question-word-display">
        <span class="question-chinese-big">${escapeHtml(q.answer.chinese)}</span>
        <span class="question-pinyin-big">${escapeHtml(q.answer.pinyin)}</span>
        ${q.answer.zhuyin ? `<span class="question-zhuyin-big">${escapeHtml(q.answer.zhuyin)}</span>` : ''}
      </div>`;
  } else if (q.type === 'meaning_to_word') {
    questionVisual.innerHTML = `
      <div class="question-word-display">
        <span class="question-english-big">${escapeHtml(q.answer.english)}</span>
      </div>`;
  } else {
    // image_to_word: show uploaded image if present, else emoji
    if (q.imageUrl) {
      questionVisual.innerHTML = `<img class="question-image" src="${escapeAttr(q.imageUrl)}" alt="" />`;
    } else {
      questionVisual.innerHTML = `<span class="question-emoji">${q.emoji || '📖'}</span>`;
    }
  }

  questionText.textContent = q.question_en;

  // Options rendering depends on question type:
  // word_to_meaning → show only English (Chinese is in the prompt, would be a cheat)
  // meaning_to_word → show Chinese + phonetics (English is in the prompt)
  // image_to_word   → show full card
  optionsGrid.innerHTML = '';
  q.options.forEach((opt, i) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    if (q.type === 'word_to_meaning') {
      card.classList.add('option-card-english');
      card.innerHTML = `<span class="opt-english-big">${escapeHtml(opt.english)}</span>`;
    } else {
      card.innerHTML = `
        <span class="opt-chinese">${escapeHtml(opt.chinese)}</span>
        <span class="opt-pinyin">${escapeHtml(opt.pinyin)}</span>
        ${opt.zhuyin ? `<span class="opt-zhuyin">${escapeHtml(opt.zhuyin)}</span>` : ''}
        ${q.type === 'meaning_to_word' ? '' : `<span class="opt-english">${escapeHtml(opt.english)}</span>`}`;
    }
    card.addEventListener('click', () => handleAnswer(i));
    optionsGrid.appendChild(card);
  });
}

function handleAnswer(selectedIndex) {
  if (optionsGrid.querySelector('.answered')) return;

  const q       = state.questions[state.currentIndex];
  const correct = selectedIndex === q.correctIndex;
  const elapsed = Math.round((Date.now() - state.questionStartTime) / 1000);

  if (correct) state.score++;

  state.answers.push({
    questionId: q.id,
    topic:      q.topic,
    chinese:    q.answer.chinese,
    pinyin:     q.answer.pinyin,
    zhuyin:     q.answer.zhuyin || '',
    english:    q.answer.english,
    correct,
    timeTaken:  elapsed
  });

  const cards = optionsGrid.querySelectorAll('.option-card');
  cards.forEach((card, i) => {
    card.classList.add('answered');
    if (i === q.correctIndex) {
      card.classList.add(correct && i === selectedIndex ? 'selected-correct' : 'reveal-correct');
    }
    if (i === selectedIndex && !correct) card.classList.add('selected-wrong');
  });

  feedbackBanner.className = 'feedback-banner ' + (correct ? 'correct' : 'wrong');
  const phon = q.answer.zhuyin ? `${q.answer.pinyin} · ${q.answer.zhuyin}` : q.answer.pinyin;
  feedbackBanner.textContent = correct
    ? `✓ Correct — ${q.answer.chinese} (${phon}) means "${q.answer.english}"`
    : `✗ Answer: ${q.answer.chinese} (${phon}) = ${q.answer.english}`;

  scoreLabel.textContent = `Score ${state.score}`;
  nextBtn.classList.remove('d-none');
  nextBtn.textContent = state.currentIndex < state.questions.length - 1
    ? 'Next 下一題' : 'See Results 看結果';
}

function nextQuestion() {
  state.currentIndex++;
  if (state.currentIndex < state.questions.length) {
    showQuestion(state.currentIndex);
  } else {
    showResults();
  }
}

/* ─── Results ─── */
async function showResults() {
  const duration = Math.round((Date.now() - state.startTime) / 1000);
  const pct      = Math.round((state.score / state.questions.length) * 100);

  showScreen('results');

  scorePercent.textContent = pct + '%';
  scoreDetail.textContent  = `${state.score} of ${state.questions.length} correct`;
  scoreCircle.className = 'score-circle ' + (pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low');

  let msg;
  if (pct >= 90)      msg = 'Excellent! 太棒了！';
  else if (pct >= 70) msg = 'Great job! 做得很好！';
  else if (pct >= 50) msg = 'Good try! 不錯！';
  else                msg = 'Keep practicing! 繼續加油！';
  resultMessage.textContent = msg;

  resultTitle.textContent = `${state.studentName} — Result`;
  state.breakdownFilter = 'all';
  breakdownTabs.forEach(b => b.classList.toggle('active', b.dataset.bdTab === 'all'));
  renderBreakdown();

  try {
    await fetch('/api/quiz/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName:  state.studentName,
        topic:        state.assignmentId
                        ? state.questions[0].topic
                        : (state.topic === 'all' ? 'Mixed' : state.topic),
        assignmentId: state.assignmentId,
        score:        state.score,
        total:        state.questions.length,
        answers:      state.answers,
        duration
      })
    });
  } catch { /* non-critical */ }
}

function renderBreakdown() {
  const rows = state.breakdownFilter === 'wrong'
    ? state.answers.filter(a => !a.correct)
    : state.answers;

  if (rows.length === 0) {
    resultBreakdown.innerHTML = `<div class="text-center text-muted py-3">No items.</div>`;
    return;
  }

  resultBreakdown.innerHTML = '';
  rows.forEach(a => {
    const row = document.createElement('div');
    row.className = `breakdown-row ${a.correct ? 'correct-row' : 'wrong-row'}`;
    row.innerHTML = `
      <span class="bd-icon">${a.correct ? '✓' : '✗'}</span>
      <span class="bd-chinese">${escapeHtml(a.chinese)}</span>
      <div class="bd-meta">
        <span class="bd-pinyin">${escapeHtml(a.pinyin)}${a.zhuyin ? ' · ' + escapeHtml(a.zhuyin) : ''}</span>
        <span class="bd-english">${escapeHtml(a.english)}</span>
      </div>`;
    resultBreakdown.appendChild(row);
  });
}

function retryQuiz() { launchQuiz(); }

/* ─── Helpers ─── */
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

function shuffleOptions(question) {
  const correctOption = question.options[question.correctIndex];
  const shuffled = [...question.options].sort(() => Math.random() - 0.5);
  const newCorrectIdx = shuffled.findIndex(o => o.chinese === correctOption.chinese);
  return { ...question, options: shuffled, correctIndex: newCorrectIdx };
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttr(str) { return escapeHtml(str); }

/* ─── Start ─── */
init();
