/* ─── State ─── */
const state = {
  activeTab:           'chat',
  conversationHistory: [],
  pendingQuestions:    null,
  questions:           [],
  results:             [],
  students:            [],
  assignments:         [],
  topics:              [],
  assignTopicsPicked:  new Set(),
  selectedStudent:     null,
  studentDetail:       null,
  expandedTopics:      new Set()
};

/* ─── DOM ─── */
const navBtns          = document.querySelectorAll('.nav-btn');
const chatMessages     = document.getElementById('chat-messages');
const chatInput        = document.getElementById('chat-input');
const sendBtn          = document.getElementById('send-btn');
const targetStudent    = document.getElementById('target-student');
const previewPanel     = document.getElementById('preview-panel');
const previewCount     = document.getElementById('preview-count');
const previewList      = document.getElementById('preview-list');
const saveQuestionsBtn = document.getElementById('save-questions-btn');
const discardBtn       = document.getElementById('discard-btn');
const questionsBadge   = document.getElementById('question-count-badge');
const topicGroups      = document.getElementById('topic-groups');
const summaryCards     = document.getElementById('summary-cards');
const resultsTbody     = document.getElementById('results-tbody');
const clearResultsBtn  = document.getElementById('clear-results-btn');
const resultsNameFilter= document.getElementById('results-name-filter');

const assignName       = document.getElementById('assign-name');
const assignTopics     = document.getElementById('assign-topics');
const assignCount      = document.getElementById('assign-count');
const assignNotes      = document.getElementById('assign-notes');
const assignBtn        = document.getElementById('assign-btn');
const studentFilter    = document.getElementById('student-filter');
const studentList      = document.getElementById('student-list');
const studentDetailBox = document.getElementById('student-detail');

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
  clearResultsBtn.addEventListener('click', clearResults);
  resultsNameFilter.addEventListener('input', renderResults);

  assignBtn.addEventListener('click', createAssignment);
  studentFilter.addEventListener('input', renderStudentList);

  await Promise.all([loadQuestions(), loadStudents()]);
}

/* ─── Tab navigation ─── */
function switchTab(tab) {
  state.activeTab = tab;
  navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.id === `tab-${tab}`)
  );

  if (tab === 'questions') loadQuestions();
  if (tab === 'students')  loadStudents();
  if (tab === 'results')   loadResults();
}

/* ─── AI CHAT ─── */
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message || sendBtn.disabled) return;

  appendBubble('user', message);
  chatInput.value = '';
  sendBtn.disabled = true;

  state.conversationHistory.push({ role: 'user', content: message });

  const typingId = appendTypingIndicator();
  const targeted = targetStudent.value || null;

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: state.conversationHistory.slice(-10),
        studentName: targeted
      })
    });
    const data = await res.json();
    removeTypingIndicator(typingId);

    if (data.error) {
      appendBubble('ai', '⚠ Error: ' + data.error);
      sendBtn.disabled = false;
      return;
    }

    state.conversationHistory.push({ role: 'assistant', content: data.response });

    if (data.questions && data.questions.length > 0) {
      const ctxNote = targeted ? ` (targeted for ${targeted})` : '';
      appendBubble('ai', `Generated ${data.questions.length} questions${ctxNote}. Review the preview on the right.`);
      showPreview(data.questions);
    } else {
      appendBubble('ai', data.response);
    }
  } catch {
    removeTypingIndicator(typingId);
    appendBubble('ai', '⚠ Could not reach the server.');
  }

  sendBtn.disabled = false;
}

function appendBubble(role, text) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role === 'ai' ? 'ai-bubble' : 'user-bubble'}`;
  div.innerHTML = `<div class="bubble-content">${escapeHtml(text).replace(/\n/g, '<br />')}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTypingIndicator() {
  const id  = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id        = id;
  div.className = 'chat-bubble ai-bubble typing-bubble';
  div.innerHTML = '<div class="bubble-content">Thinking…</div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/* ─── Preview ─── */
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
        ${q.answer.zhuyin ? `<span class="preview-zhuyin">${escapeHtml(q.answer.zhuyin)}</span>` : ''}
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
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: state.pendingQuestions })
    });
    const data = await res.json();

    if (data.success) {
      appendBubble('ai', `Saved ${data.count} questions to the bank.`);
      discardPreview();
      await loadQuestions();
    }
  } catch {
    appendBubble('ai', '⚠ Failed to save questions.');
  }
}

/* ─── QUESTION BANK (grouped by topic) ─── */
async function loadQuestions() {
  try {
    const res = await fetch('/api/admin/questions');
    state.questions = await res.json();
    state.topics = [...new Set(state.questions.map(q => q.topic))].sort();
    renderTopicGroups();
    renderAssignTopicPicker();
  } catch {
    topicGroups.innerHTML = '<div class="loading">Failed to load questions.</div>';
  }
}

function renderTopicGroups() {
  questionsBadge.textContent = state.questions.length + ' questions';

  if (state.questions.length === 0) {
    topicGroups.innerHTML = `
      <div class="empty-state">
        <p>No questions yet. Use the AI Generator tab to create some.</p>
      </div>`;
    return;
  }

  const grouped = {};
  state.questions.forEach(q => {
    if (!grouped[q.topic]) grouped[q.topic] = [];
    grouped[q.topic].push(q);
  });

  topicGroups.innerHTML = '';
  Object.keys(grouped).sort().forEach(topic => {
    const items = grouped[topic];
    const isOpen = state.expandedTopics.has(topic);

    const group = document.createElement('div');
    group.className = 'topic-group' + (isOpen ? ' open' : '');
    group.innerHTML = `
      <div class="topic-group-header">
        <div class="topic-title-row">
          <span class="topic-caret">▶</span>
          <span class="topic-name">${escapeHtml(topic)}</span>
          <span class="topic-count">· ${items.length} question${items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="topic-actions">
          <button class="icon-btn" data-action="rename">Rename</button>
          <button class="icon-btn danger" data-action="delete">Delete</button>
        </div>
      </div>
      <div class="topic-group-body"></div>`;

    const body = group.querySelector('.topic-group-body');
    items.forEach(q => {
      const row = document.createElement('div');
      row.className = 'q-row';
      row.innerHTML = `
        <span class="q-emoji">${q.emoji || '📖'}</span>
        <div class="q-answer">
          <span class="q-chinese">${escapeHtml(q.answer.chinese)}</span>
          <span class="q-pinyin">${escapeHtml(q.answer.pinyin)}</span>
          ${q.answer.zhuyin ? `<span class="q-zhuyin">${escapeHtml(q.answer.zhuyin)}</span>` : ''}
          <span class="q-english">${escapeHtml(q.answer.english)}</span>
        </div>
        <span class="q-type-tag">${formatType(q.type)}</span>
        <button class="q-delete" title="Delete">✕</button>`;
      row.querySelector('.q-delete').addEventListener('click', e => {
        e.stopPropagation();
        deleteQuestion(q.id);
      });
      body.appendChild(row);
    });

    // Header click toggles
    const header = group.querySelector('.topic-group-header');
    header.addEventListener('click', e => {
      if (e.target.closest('.topic-actions')) return;
      if (state.expandedTopics.has(topic)) state.expandedTopics.delete(topic);
      else state.expandedTopics.add(topic);
      renderTopicGroups();
    });

    group.querySelector('[data-action="rename"]').addEventListener('click', e => {
      e.stopPropagation();
      renameTopic(topic);
    });
    group.querySelector('[data-action="delete"]').addEventListener('click', e => {
      e.stopPropagation();
      deleteTopic(topic, items.length);
    });

    topicGroups.appendChild(group);
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

async function renameTopic(oldName) {
  const newName = prompt(`Rename topic "${oldName}" to:`, oldName);
  if (!newName || newName.trim() === oldName) return;
  try {
    const res = await fetch('/api/admin/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName: newName.trim() })
    });
    const data = await res.json();
    if (data.success) {
      state.expandedTopics.delete(oldName);
      state.expandedTopics.add(newName.trim());
      await loadQuestions();
    }
  } catch {
    alert('Failed to rename topic.');
  }
}

async function deleteTopic(name, count) {
  if (!confirm(`Delete the entire "${name}" topic and ALL ${count} of its questions? This cannot be undone.`)) return;
  try {
    await fetch(`/api/admin/topics/${encodeURIComponent(name)}`, { method: 'DELETE' });
    state.expandedTopics.delete(name);
    await loadQuestions();
  } catch {
    alert('Failed to delete topic.');
  }
}

/* ─── STUDENTS TAB ─── */
async function loadStudents() {
  try {
    const [studentsRes, assignmentsRes] = await Promise.all([
      fetch('/api/admin/students'),
      fetch('/api/admin/assignments')
    ]);
    state.students = await studentsRes.json();
    state.assignments = await assignmentsRes.json();

    renderStudentList();
    populateTargetStudentDropdown();

    // Re-render currently selected detail to reflect changes
    if (state.selectedStudent) {
      loadStudentDetail(state.selectedStudent);
    }
  } catch {
    studentList.innerHTML = '<div class="loading">Failed to load students.</div>';
  }
}

function populateTargetStudentDropdown() {
  const current = targetStudent.value;
  // Clear all options except the first ("Anyone")
  while (targetStudent.options.length > 1) targetStudent.remove(1);
  state.students.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.textContent = s.name + (s.averageScore !== null ? ` (avg ${s.averageScore}%)` : ' (new)');
    targetStudent.appendChild(opt);
  });
  if (current && state.students.some(s => s.name === current)) {
    targetStudent.value = current;
  }
}

function renderAssignTopicPicker() {
  if (state.topics.length === 0) {
    assignTopics.innerHTML = '<span class="chip-empty">No topics yet — generate some questions first via AI Generator.</span>';
    return;
  }

  assignTopics.innerHTML = '';
  state.topics.forEach(t => {
    const chip = document.createElement('span');
    chip.className = 'chip' + (state.assignTopicsPicked.has(t) ? ' active' : '');
    chip.textContent = t;
    chip.addEventListener('click', () => {
      if (state.assignTopicsPicked.has(t)) state.assignTopicsPicked.delete(t);
      else state.assignTopicsPicked.add(t);
      renderAssignTopicPicker();
    });
    assignTopics.appendChild(chip);
  });
}

async function createAssignment() {
  const name = assignName.value.trim();
  if (!name) { alert('Enter a student name first.'); return; }
  if (state.assignTopicsPicked.size === 0) { alert('Pick at least one topic.'); return; }

  try {
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName:   name,
        topics:        [...state.assignTopicsPicked],
        questionCount: parseInt(assignCount.value),
        notes:         assignNotes.value.trim()
      })
    });
    const data = await res.json();
    if (data.success) {
      assignName.value = '';
      assignNotes.value = '';
      state.assignTopicsPicked.clear();
      renderAssignTopicPicker();
      await loadStudents();
      // Auto-select the just-assigned student
      const match = state.students.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (match) selectStudent(match.name);
      alert(`Assignment created for ${data.assignment.studentName}.`);
    }
  } catch {
    alert('Failed to create assignment.');
  }
}

function renderStudentList() {
  const filter = studentFilter.value.trim().toLowerCase();
  const shown = filter
    ? state.students.filter(s => s.name.toLowerCase().includes(filter))
    : state.students;

  if (shown.length === 0) {
    studentList.innerHTML = `<div class="empty-state" style="padding:20px"><p>${filter ? 'No matching students.' : 'No students yet.'}</p></div>`;
    return;
  }

  studentList.innerHTML = '';
  shown.forEach(s => {
    const row = document.createElement('div');
    row.className = 'student-row' + (state.selectedStudent === s.name ? ' active' : '');
    const pillClass = s.averageScore === null ? '' :
      s.averageScore >= 80 ? 'high' : s.averageScore >= 50 ? 'mid' : 'low';
    const pillText = s.averageScore === null ? 'new' : `${s.averageScore}%`;

    row.innerHTML = `
      <div>
        <div class="student-name">${escapeHtml(s.name)}</div>
        <div class="student-mini">${s.tests} test${s.tests !== 1 ? 's' : ''} · ${s.assignmentCount} assignment${s.assignmentCount !== 1 ? 's' : ''}</div>
      </div>
      <span class="student-score-pill ${pillClass}">${pillText}</span>`;
    row.addEventListener('click', () => selectStudent(s.name));
    studentList.appendChild(row);
  });
}

async function selectStudent(name) {
  state.selectedStudent = name;
  renderStudentList();
  await loadStudentDetail(name);
}

async function loadStudentDetail(name) {
  studentDetailBox.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const res = await fetch(`/api/admin/students/${encodeURIComponent(name)}`);
    state.studentDetail = await res.json();
    renderStudentDetail();
  } catch {
    studentDetailBox.innerHTML = '<div class="empty-state">Failed to load student details.</div>';
  }
}

function renderStudentDetail() {
  const d = state.studentDetail;
  if (!d) return;

  const totalTests = d.results.length;
  const avg = totalTests === 0 ? null :
    Math.round(d.results.reduce((s, r) => s + r.percentage, 0) / totalTests);

  let html = `
    <h3>${escapeHtml(d.name)}</h3>
    <p class="detail-sub">${totalTests} test${totalTests !== 1 ? 's' : ''} taken${avg !== null ? ` · average ${avg}%` : ''}</p>`;

  // Active assignments
  html += `<div class="detail-section">
    <h4>Active Assignments (${d.assignments.length})</h4>`;
  if (d.assignments.length === 0) {
    html += '<p style="font-size:0.85rem;color:var(--muted)">No assignments yet.</p>';
  } else {
    d.assignments.forEach(a => {
      const date = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      html += `
        <div class="assignment-card">
          <div class="ac-info">
            <div class="ac-topics">${escapeHtml(a.topics.join(' · '))}</div>
            <div class="ac-meta">${a.questionCount} questions · ${date}${a.notes ? ' · ' + escapeHtml(a.notes) : ''}</div>
          </div>
          <button class="icon-btn danger" data-aid="${escapeHtml(a.id)}">Remove</button>
        </div>`;
    });
  }
  html += '</div>';

  // Wrong answers
  html += `<div class="detail-section">
    <h4>Most-Missed Words (${d.wrongAnswers.length})</h4>`;
  if (d.wrongAnswers.length === 0) {
    html += '<p style="font-size:0.85rem;color:var(--muted)">No wrong answers — nice work!</p>';
  } else {
    html += '<div class="wrong-word-list">';
    d.wrongAnswers.slice(0, 15).forEach(w => {
      html += `
        <div class="wrong-word">
          <span class="ww-chinese">${escapeHtml(w.chinese)}</span>
          <div class="ww-meta">
            <span class="ww-pinyin">${escapeHtml(w.pinyin)}${w.zhuyin ? ' · ' + escapeHtml(w.zhuyin) : ''}</span>
            <span class="ww-english">${escapeHtml(w.english)}${w.topic ? ' · ' + escapeHtml(w.topic) : ''}</span>
          </div>
          <span class="ww-count">×${w.timesMissed}</span>
        </div>`;
    });
    if (d.wrongAnswers.length > 15) {
      html += `<p style="font-size:0.78rem;color:var(--muted);margin-top:6px">+ ${d.wrongAnswers.length - 15} more</p>`;
    }
    html += '</div>';
  }
  html += '</div>';

  // Test history
  html += `<div class="detail-section">
    <h4>Test History (${d.results.length})</h4>`;
  if (d.results.length === 0) {
    html += '<p style="font-size:0.85rem;color:var(--muted)">No test attempts yet.</p>';
  } else {
    d.results.slice(0, 20).forEach(r => {
      const date = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const pillClass = r.percentage >= 80 ? 'high' : r.percentage >= 50 ? 'mid' : 'low';
      html += `
        <div class="history-row">
          <span class="history-topic">${escapeHtml(r.topic)}</span>
          <span class="history-score">${r.score} / ${r.total}</span>
          <span class="score-pill score-${pillClass}">${r.percentage}%</span>
          <span class="history-date" title="${time}">${date}</span>
        </div>`;
    });
  }
  html += '</div>';

  studentDetailBox.innerHTML = html;

  // Wire assignment-remove buttons
  studentDetailBox.querySelectorAll('[data-aid]').forEach(btn => {
    btn.addEventListener('click', () => removeAssignment(btn.dataset.aid));
  });
}

async function removeAssignment(aid) {
  if (!confirm('Remove this assignment?')) return;
  try {
    await fetch(`/api/admin/assignments/${aid}`, { method: 'DELETE' });
    await loadStudents();
  } catch {
    alert('Failed to remove assignment.');
  }
}

/* ─── ALL RESULTS TAB ─── */
async function loadResults() {
  try {
    const res = await fetch('/api/admin/results');
    state.results = await res.json();
    renderResults();
  } catch {
    resultsTbody.innerHTML = '<tr><td colspan="6" class="loading">Failed to load results.</td></tr>';
  }
}

function computeSummary(results) {
  if (results.length === 0) {
    return { totalTests: 0, averageScore: 0, topicBreakdown: {} };
  }
  const totalTests = results.length;
  const averageScore = Math.round(
    results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalTests
  );
  const topicBreakdown = {};
  results.forEach(r => {
    if (!topicBreakdown[r.topic]) topicBreakdown[r.topic] = { count: 0, totalScore: 0 };
    topicBreakdown[r.topic].count++;
    topicBreakdown[r.topic].totalScore += (r.percentage || 0);
  });
  Object.keys(topicBreakdown).forEach(t => {
    topicBreakdown[t].averageScore = Math.round(
      topicBreakdown[t].totalScore / topicBreakdown[t].count
    );
  });
  return { totalTests, averageScore, topicBreakdown };
}

function renderSummary(summary, displayName) {
  const topicList = Object.entries(summary.topicBreakdown || {})
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);

  const testsLabel = displayName ? `${displayName}'s Tests` : 'Total Tests';
  const avgLabel   = displayName ? `${displayName}'s Average` : 'Average Score';

  let html = `
    <div class="summary-card">
      <span class="sc-value">${summary.totalTests}</span>
      <div class="sc-label">${escapeHtml(testsLabel)}</div>
    </div>
    <div class="summary-card">
      <span class="sc-value">${summary.totalTests > 0 ? summary.averageScore + '%' : '—'}</span>
      <div class="sc-label">${escapeHtml(avgLabel)}</div>
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
  const filterRaw = resultsNameFilter.value.trim();
  const filter = filterRaw.toLowerCase();
  const shown = filter
    ? state.results.filter(r => r.studentName && r.studentName.toLowerCase().includes(filter))
    : state.results;

  // Use the matched student's actual capitalized name when exactly one unique student matches;
  // otherwise fall back to whatever the teacher typed.
  let displayName = null;
  if (filterRaw) {
    const uniqueNames = [...new Set(shown.map(r => r.studentName))];
    displayName = uniqueNames.length === 1 ? uniqueNames[0] : filterRaw;
  }

  renderSummary(computeSummary(shown), displayName);

  if (shown.length === 0) {
    resultsTbody.innerHTML = `<tr><td colspan="6" class="loading">${filter ? `No results for "${escapeHtml(filterRaw)}" yet.` : 'No results yet.'}</td></tr>`;
    return;
  }

  resultsTbody.innerHTML = shown.map(r => {
    const pillClass = r.percentage >= 80 ? 'score-high' : r.percentage >= 50 ? 'score-mid' : 'score-low';
    const dateStr   = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr   = new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const duration  = r.duration ? formatDuration(r.duration) : '—';

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
    await loadStudents();
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
