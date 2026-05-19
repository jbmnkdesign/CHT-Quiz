/* ─── State ─── */
const state = {
  activeTab:          'chat',
  conversationHistory: [],
  pendingQuestions:   null,
  questions:          [],
  results:            []
};

/* ─── DOM References ─── */
const navBtns          = document.querySelectorAll('.nav-btn');
const chatMessages     = document.getElementById('chat-messages');
const chatInput        = document.getElementById('chat-input');
const sendBtn          = document.getElementById('send-btn');
const previewPanel     = document.getElementById('preview-panel');
const previewCount     = document.getElementById('preview-count');
const previewList      = document.getElementById('preview-list');
const saveQuestionsBtn = document.getElementById('save-questions-btn');
const discardBtn       = document.getElementById('discard-btn');
const filterTopic      = document.getElementById('filter-topic');
const questionsBadge   = document.getElementById('question-count-badge');
const questionsList    = document.getElementById('questions-list');
const summaryCards     = document.getElementById('summary-cards');
const resultsTbody     = document.getElementById('results-tbody');
const clearResultsBtn  = document.getElementById('clear-results-btn');

/* ─── Init ─── */
async function init() {
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  saveQuestionsBtn.addEventListener('click', saveGeneratedQuestions);
  discardBtn.addEventListener('click', discardPreview);
  filterTopic.addEventListener('change', renderQuestions);
  clearResultsBtn.addEventListener('click', clearResults);

  await loadQuestions();
}

/* ─── Tab Navigation ─── */
function switchTab(tab) {
  state.activeTab = tab;
  navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));

  if (tab === 'questions') loadQuestions();
  if (tab === 'results')   loadResults();
}

/* ─── AI Chat ─── */
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || sendBtn.disabled) return;

  appendBubble('user', message);
  chatInput.value = '';
  sendBtn.disabled = true;

  state.conversationHistory.push({ role: 'user', content: message });

  const typingId = appendTypingIndicator();

  try {
    const res  = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: state.conversationHistory.slice(-10)
      })
    });
    const data = await res.json();
    removeTypingIndicator(typingId);

    if (data.error) {
      appendBubble('ai', '⚠️ Error: ' + data.error);
      sendBtn.disabled = false;
      return;
    }

    state.conversationHistory.push({ role: 'assistant', content: data.response });

    if (data.questions && data.questions.length > 0) {
      appendBubble('ai', `✅ I generated ${data.questions.length} questions! Check the preview panel on the right to review and save them.`);
      showPreview(data.questions);
    } else {
      appendBubble('ai', data.response);
    }
  } catch (err) {
    removeTypingIndicator(typingId);
    appendBubble('ai', '⚠️ Could not reach the server. Please try again.');
  }

  sendBtn.disabled = false;
}

function appendBubble(role, text) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role === 'ai' ? 'ai-bubble' : 'user-bubble'}`;
  div.innerHTML = `<div class="bubble-content">${escapeHtml(text).replace(/\n/g, '<br />')}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function appendTypingIndicator() {
  const id  = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id        = id;
  div.className = 'chat-bubble ai-bubble typing-bubble';
  div.innerHTML = '<div class="bubble-content">Thinking... ⌛</div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/* ─── Preview Panel ─── */
function showPreview(questions) {
  state.pendingQuestions = questions;
  previewCount.textContent = questions.length + ' questions';

  previewList.innerHTML = '';
  questions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'preview-q';
    div.innerHTML = `
      <div class="preview-q-header">
        <span class="preview-q-emoji">${q.emoji || '📖'}</span>
        <span class="preview-q-topic">${escapeHtml(q.topic)}</span>
        <span class="preview-q-type">${formatType(q.type)}</span>
      </div>
      <div class="preview-q-answer">
        <span class="preview-chinese">${escapeHtml(q.answer.chinese)}</span>
        <span class="preview-pinyin">${escapeHtml(q.answer.pinyin)}</span>
        <span class="preview-english">${escapeHtml(q.answer.english)}</span>
      </div>`;
    previewList.appendChild(div);
  });

  previewPanel.classList.remove('hidden');
}

function discardPreview() {
  state.pendingQuestions = null;
  previewPanel.classList.add('hidden');
}

async function saveGeneratedQuestions() {
  if (!state.pendingQuestions) return;

  try {
    const res  = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: state.pendingQuestions })
    });
    const data = await res.json();

    if (data.success) {
      appendBubble('ai', `🎉 Saved ${data.count} questions to the question bank!`);
      discardPreview();
      await loadQuestions();
    }
  } catch {
    appendBubble('ai', '⚠️ Failed to save questions. Please try again.');
  }
}

/* ─── Questions Tab ─── */
async function loadQuestions() {
  try {
    const res  = await fetch('/api/admin/questions');
    state.questions = await res.json();

    // Populate topic filter
    const topics = [...new Set(state.questions.map(q => q.topic))].sort();
    const existing = [...filterTopic.options].map(o => o.value);
    topics.forEach(t => {
      if (!existing.includes(t)) {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        filterTopic.appendChild(opt);
      }
    });

    renderQuestions();
  } catch {
    questionsList.innerHTML = '<div class="loading">Failed to load questions.</div>';
  }
}

function renderQuestions() {
  const filter = filterTopic.value;
  const filtered = filter === 'all'
    ? state.questions
    : state.questions.filter(q => q.topic === filter);

  questionsBadge.textContent = filtered.length + ' questions';

  if (filtered.length === 0) {
    questionsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No questions yet. Use the AI Chat tab to generate some!</p>
      </div>`;
    return;
  }

  questionsList.innerHTML = '';
  filtered.forEach(q => {
    const card = document.createElement('div');
    card.className = 'q-card';
    card.innerHTML = `
      <span class="q-emoji">${q.emoji || '📖'}</span>
      <div class="q-main">
        <div class="q-answer">
          <span class="q-chinese">${escapeHtml(q.answer.chinese)}</span>
          <span class="q-pinyin">${escapeHtml(q.answer.pinyin)}</span>
          <span class="q-english">${escapeHtml(q.answer.english)}</span>
        </div>
        <div class="q-meta">
          <span class="tag tag-topic">${escapeHtml(q.topic)}</span>
          <span class="tag tag-type">${formatType(q.type)}</span>
        </div>
      </div>
      <button class="q-delete" title="Delete question" data-id="${escapeHtml(q.id)}">🗑</button>`;

    card.querySelector('.q-delete').addEventListener('click', () => deleteQuestion(q.id));
    questionsList.appendChild(card);
  });
}

async function deleteQuestion(id) {
  if (!confirm('Delete this question?')) return;
  try {
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    await loadQuestions();
  } catch {
    alert('Failed to delete question.');
  }
}

/* ─── Results Tab ─── */
async function loadResults() {
  try {
    const [resultsRes, summaryRes] = await Promise.all([
      fetch('/api/admin/results'),
      fetch('/api/admin/results/summary')
    ]);
    state.results = await resultsRes.json();
    const summary  = await summaryRes.json();
    renderSummary(summary);
    renderResults();
  } catch {
    resultsTbody.innerHTML = '<tr><td colspan="6" class="loading">Failed to load results.</td></tr>';
  }
}

function renderSummary(summary) {
  const topicList = Object.entries(summary.topicBreakdown || {})
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);

  let html = `
    <div class="summary-card">
      <span class="sc-value">${summary.totalTests}</span>
      <div class="sc-label">Total Tests</div>
    </div>
    <div class="summary-card">
      <span class="sc-value">${summary.averageScore}%</span>
      <div class="sc-label">Average Score</div>
    </div>`;

  topicList.forEach(([topic, data]) => {
    html += `
      <div class="summary-card">
        <span class="sc-value">${data.averageScore}%</span>
        <div class="sc-label">${escapeHtml(topic)} avg</div>
      </div>`;
  });

  summaryCards.innerHTML = html;
}

function renderResults() {
  if (state.results.length === 0) {
    resultsTbody.innerHTML = '<tr><td colspan="6" class="loading">No results yet. Students will appear here after completing quizzes.</td></tr>';
    return;
  }

  resultsTbody.innerHTML = state.results.map(r => {
    const pillClass  = r.percentage >= 80 ? 'score-high' : r.percentage >= 50 ? 'score-mid' : 'score-low';
    const dateStr    = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr    = new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const duration   = r.duration ? formatDuration(r.duration) : '—';

    return `<tr>
      <td><strong>${escapeHtml(r.studentName)}</strong></td>
      <td>${escapeHtml(r.topic)}</td>
      <td>${r.score} / ${r.total}</td>
      <td><span class="score-pill ${pillClass}">${r.percentage}%</span></td>
      <td>${duration}</td>
      <td title="${timeStr}">${dateStr}</td>
    </tr>`;
  }).join('');
}

async function clearResults() {
  if (!confirm('Clear ALL student results? This cannot be undone.')) return;
  try {
    await fetch('/api/admin/results', { method: 'DELETE' });
    await loadResults();
  } catch {
    alert('Failed to clear results.');
  }
}

/* ─── Helpers ─── */
function formatType(type) {
  const map = { image_to_word: 'Picture', word_to_meaning: 'Read', meaning_to_word: 'Translate' };
  return map[type] || type;
}

function formatDuration(secs) {
  if (secs < 60) return secs + 's';
  return Math.floor(secs / 60) + 'm ' + (secs % 60) + 's';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── Start ─── */
init();
