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
  expandedTopics:      new Set(),
  editingQuestion:     null,
  formImageDataUrl:    null
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
const backfillBtn      = document.getElementById('backfill-zhuyin-btn');
const addQuestionBtn   = document.getElementById('add-question-btn');
const restoreSeedBtn   = document.getElementById('restore-seed-btn');
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

const questionModalEl  = document.getElementById('questionModal');
const questionModal    = new bootstrap.Modal(questionModalEl);
const fqTitle          = document.getElementById('questionModalTitle');
const fqTopic          = document.getElementById('fq-topic');
const fqTopicSuggest   = document.getElementById('topic-suggestions');
const fqType           = document.getElementById('fq-type');
const fqQuestion       = document.getElementById('fq-question');
const fqEmoji          = document.getElementById('fq-emoji');
const fqImageUrl       = document.getElementById('fq-image-url');
const fqImageFile      = document.getElementById('fq-image-file');
const fqImagePreview   = document.getElementById('fq-image-preview');
const fqOptionsWrap    = document.getElementById('fq-options');
const fqSave           = document.getElementById('fq-save');

/* ─── Bootstrap toast / confirm helpers ─── */
const toastContainer = document.getElementById('toastContainer');
const confirmModalEl = document.getElementById('confirmModal');
const confirmModal   = new bootstrap.Modal(confirmModalEl);
const confirmTitle   = document.getElementById('confirmTitle');
const confirmBody    = document.getElementById('confirmBody');
const confirmOk      = document.getElementById('confirmOk');
const confirmCancel  = document.getElementById('confirmCancel');

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} align-items-center border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  toastContainer.appendChild(toast);
  const bs = new bootstrap.Toast(toast, { delay: type === 'danger' ? 6000 : 4000 });
  bs.show();
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function showConfirm({ title = 'Confirm', body, okText = 'OK', cancelText = 'Cancel', danger = false, inputDefault } = {}) {
  return new Promise(resolve => {
    confirmTitle.textContent = title;
    confirmOk.textContent    = okText;
    confirmCancel.textContent= cancelText;
    confirmOk.className      = 'btn ' + (danger ? 'btn-outline-danger' : 'btn-primary');

    // Reset body — support both plain text and text-with-input variants
    confirmBody.innerHTML = '';
    let inputEl = null;
    if (body) {
      const p = document.createElement('p');
      p.className = 'mb-2';
      p.textContent = body;
      confirmBody.appendChild(p);
    }
    if (typeof inputDefault === 'string') {
      inputEl = document.createElement('input');
      inputEl.className = 'form-control';
      inputEl.type = 'text';
      inputEl.value = inputDefault;
      confirmBody.appendChild(inputEl);
      // Auto-focus + Enter submits
      setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); onOk(); }
      });
    }

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      confirmOk.removeEventListener('click', onOk);
      confirmModalEl.removeEventListener('hidden.bs.modal', onHide);
      resolve(result);
    };
    const onOk = () => {
      const value = inputEl ? inputEl.value : true;
      confirmModal.hide();
      finish(value);
    };
    const onHide = () => finish(inputEl ? null : false);
    confirmOk.addEventListener('click', onOk);
    confirmModalEl.addEventListener('hidden.bs.modal', onHide);
    confirmModal.show();
  });
}

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
  backfillBtn.addEventListener('click', backfillZhuyin);
  addQuestionBtn.addEventListener('click', () => openQuestionModal(null));
  restoreSeedBtn.addEventListener('click', restoreSeed);

  assignBtn.addEventListener('click', createAssignment);
  studentFilter.addEventListener('input', renderStudentList);

  // Question form interactions
  fqImageUrl.addEventListener('input', () => {
    if (fqImageUrl.value.trim()) {
      state.formImageDataUrl = null;
      fqImageFile.value = '';
    }
    renderImagePreview();
  });
  fqEmoji.addEventListener('input', renderImagePreview);
  fqImageFile.addEventListener('change', handleImageFileSelect);
  fqSave.addEventListener('click', saveQuestionForm);

  await Promise.all([loadQuestions(), loadStudents()]);
}

/* ─── Tabs ─── */
function switchTab(tab) {
  state.activeTab = tab;
  navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.id === `tab-${tab}`)
  );

  // Close mobile offcanvas after picking a tab
  const off = document.getElementById('sidebarOff');
  if (off && window.innerWidth < 992) {
    const inst = bootstrap.Offcanvas.getInstance(off);
    if (inst) inst.hide();
  }

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
    const visual = q.imageUrl
      ? `<img class="preview-q-image" src="${escapeAttr(q.imageUrl)}" alt="" />`
      : `<span class="preview-q-emoji">${q.emoji || '📖'}</span>`;
    div.innerHTML = `
      <div class="preview-q-header">
        ${visual}
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

  previewPanel.classList.remove('d-none');
}

function discardPreview() {
  state.pendingQuestions = null;
  previewPanel.classList.add('d-none');
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

/* ─── QUESTION BANK ─── */
async function loadQuestions() {
  try {
    const res = await fetch('/api/admin/questions');
    state.questions = await res.json();
    state.topics = [...new Set(state.questions.map(q => q.topic))].sort();
    renderTopicGroups();
    renderAssignTopicPicker();
    refreshTopicDatalist();
  } catch {
    topicGroups.innerHTML = '<div class="text-muted text-center py-4">Failed to load questions.</div>';
  }
}

function renderTopicGroups() {
  questionsBadge.textContent = state.questions.length + ' questions';

  // Auto-hide the backfill button when every word already has BOTH pinyin and zhuyin.
  const wordIsIncomplete = w => !w || !w.pinyin || !w.zhuyin;
  const needsBackfill = state.questions.some(q =>
    wordIsIncomplete(q.answer) || (q.options || []).some(wordIsIncomplete)
  );
  backfillBtn.classList.toggle('d-none', !needsBackfill);

  refreshRestoreSeedVisibility();

  if (state.questions.length === 0) {
    topicGroups.innerHTML = `
      <div class="empty-state">
        <p>No questions yet. Use AI Generator or click <strong>+ Add Question</strong> to create some.</p>
      </div>`;
    return;
  }

  const grouped = {};
  state.questions.forEach(q => {
    if (!grouped[q.topic]) grouped[q.topic] = [];
    grouped[q.topic].push(q);
  });

  topicGroups.innerHTML = '';
  Object.keys(grouped).sort().forEach((topic, gIndex) => {
    const items = grouped[topic];
    const safeTopicId = 'topic-' + gIndex + '-' + Math.random().toString(36).slice(2, 7);
    const isOpen = state.expandedTopics.has(topic);

    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `
      <div class="accordion-header" id="head-${safeTopicId}">
        <button class="accordion-button ${isOpen ? '' : 'collapsed'}" type="button"
                data-bs-toggle="collapse" data-bs-target="#body-${safeTopicId}"
                aria-expanded="${isOpen}" aria-controls="body-${safeTopicId}">
          <span class="me-2">${escapeHtml(topic)}</span>
          <span class="topic-count">${items.length} 題</span>
        </button>
        <div class="topic-actions">
          <button class="icon-btn" data-action="rename" type="button">Rename</button>
          <button class="icon-btn danger" data-action="delete" type="button">Delete</button>
        </div>
      </div>
      <div id="body-${safeTopicId}" class="accordion-collapse collapse ${isOpen ? 'show' : ''}">
        <div class="accordion-body"></div>
      </div>`;

    const body = item.querySelector('.accordion-body');
    items.forEach(q => {
      const row = document.createElement('div');
      // Only picture-type questions get a visual slot in the list; for
      // word_to_meaning / meaning_to_word the visual is decorative noise.
      const isPicture = q.type === 'image_to_word';
      const hasVisual = isPicture && !!(q.imageUrl || (q.emoji && q.emoji.trim()));
      row.className = 'q-row' + (hasVisual ? '' : ' no-visual');
      const visual = !isPicture
        ? ''
        : q.imageUrl
          ? `<span class="q-visual"><img src="${escapeAttr(q.imageUrl)}" alt="" /></span>`
          : q.emoji && q.emoji.trim()
            ? `<span class="q-visual">${q.emoji}</span>`
            : '';
      // Position badge makes the random correctIndex visible to the teacher
      // at a glance (e.g. 2/4 means the correct option is the 2nd).
      const total = Array.isArray(q.options) ? q.options.length : 4;
      const posBadge = Number.isInteger(q.correctIndex)
        ? `<span class="q-correct-pos" title="Correct answer position">${q.correctIndex + 1}/${total}</span>`
        : '';
      row.innerHTML = `
        ${visual}
        <div class="q-main">
          <div class="q-prompt" title="${escapeAttr(q.question_en || '')}">${escapeHtml(q.question_en || '(no prompt)')}</div>
          <div class="q-answer">
            ${posBadge}
            <span class="q-chinese">${escapeHtml(q.answer.chinese)}</span>
            <span class="q-pinyin">${escapeHtml(q.answer.pinyin || '')}</span>
            ${q.answer.zhuyin ? `<span class="q-zhuyin">${escapeHtml(q.answer.zhuyin)}</span>` : ''}
            <span class="q-english">${escapeHtml(q.answer.english)}</span>
          </div>
        </div>
        <span class="q-type-tag">${formatType(q.type)}</span>
        <div class="q-row-actions">
          <button class="icon-btn gen-image" data-img type="button" title="Generate AI image">✨</button>
          <button class="icon-btn" data-edit type="button" title="Edit">✎</button>
          <button class="icon-btn danger" data-del type="button" title="Delete">✕</button>
        </div>`;
      row.querySelector('[data-edit]').addEventListener('click', e => {
        e.stopPropagation();
        openQuestionModal(q);
      });
      row.querySelector('[data-del]').addEventListener('click', e => {
        e.stopPropagation();
        deleteQuestion(q.id);
      });
      row.querySelector('[data-img]').addEventListener('click', e => {
        e.stopPropagation();
        generateImageForQuestion(q.id, e.currentTarget);
      });
      body.appendChild(row);
    });

    // Track expand state
    const collapseEl = item.querySelector('.accordion-collapse');
    collapseEl.addEventListener('shown.bs.collapse', () => state.expandedTopics.add(topic));
    collapseEl.addEventListener('hidden.bs.collapse', () => state.expandedTopics.delete(topic));

    item.querySelector('[data-action="rename"]').addEventListener('click', e => {
      e.stopPropagation();
      renameTopic(topic);
    });
    item.querySelector('[data-action="delete"]').addEventListener('click', e => {
      e.stopPropagation();
      deleteTopic(topic, items.length);
    });

    topicGroups.appendChild(item);
  });
}

async function deleteQuestion(id) {
  const ok = await showConfirm({ title: 'Delete question', body: 'Remove this question from the bank?', okText: 'Delete', danger: true });
  if (!ok) return;
  try {
    await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    await loadQuestions();
    showToast('Question deleted.', 'success');
  } catch { showToast('Failed to delete question.', 'danger'); }
}

async function renameTopic(oldName) {
  const newName = await showConfirm({
    title: 'Rename topic',
    body: `New name for "${oldName}":`,
    okText: 'Rename',
    inputDefault: oldName
  });
  if (!newName || newName.trim() === '' || newName.trim() === oldName) return;
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
      showToast(`Renamed "${oldName}" → "${newName.trim()}".`, 'success');
    }
  } catch { showToast('Failed to rename topic.', 'danger'); }
}

async function deleteTopic(name, count) {
  const ok = await showConfirm({
    title: 'Delete topic',
    body: `Delete the entire "${name}" topic and ALL ${count} of its questions? This cannot be undone.`,
    okText: 'Delete topic', danger: true
  });
  if (!ok) return;
  try {
    await fetch(`/api/admin/topics/${encodeURIComponent(name)}`, { method: 'DELETE' });
    state.expandedTopics.delete(name);
    await loadQuestions();
    showToast(`Topic "${name}" deleted.`, 'success');
  } catch { showToast('Failed to delete topic.', 'danger'); }
}

async function backfillZhuyin() {
  const ok = await showConfirm({
    title: '拼音／注音 Backfill',
    body: 'Scan the question bank and use AI to add pinyin / 注音 to every word missing them?',
    okText: 'Run'
  });
  if (!ok) return;
  const orig = backfillBtn.textContent;
  backfillBtn.disabled = true;
  backfillBtn.textContent = 'Working…';
  try {
    const res  = await fetch('/api/admin/backfill-zhuyin', { method: 'POST' });
    const data = await res.json();
    if (!res.ok || data.error) {
      showToast('Backfill failed: ' + (data.error || 'unknown error'), 'danger');
    } else if (data.uniqueMissing === 0) {
      showToast('Every word already has pinyin and 注音.', 'info');
    } else {
      showToast(`Filled ${data.updatedFields} field(s) across ${data.mapped} unique words.`, 'success');
      await loadQuestions();
    }
  } catch (err) {
    showToast('Backfill failed: ' + err.message, 'danger');
  } finally {
    backfillBtn.disabled = false;
    backfillBtn.textContent = orig;
  }
}

async function refreshRestoreSeedVisibility() {
  try {
    const res = await fetch('/api/admin/restore-seed/status');
    if (!res.ok) return;
    const data = await res.json();
    restoreSeedBtn.classList.toggle('d-none', !data.missing);
  } catch { /* silent — leave button visible on error */ }
}

async function restoreSeed() {
  const ok = await showConfirm({
    title: 'Restore default questions',
    body: 'Add the built-in 60-question starter pack? Existing questions are not affected — this only adds missing defaults.',
    okText: 'Restore'
  });
  if (!ok) return;
  const orig = restoreSeedBtn.textContent;
  restoreSeedBtn.disabled = true;
  restoreSeedBtn.textContent = 'Working…';
  try {
    const res  = await fetch('/api/admin/restore-seed', { method: 'POST' });
    const data = await res.json();
    if (!res.ok || data.error) {
      showToast('Restore failed: ' + (data.error || 'unknown error'), 'danger');
    } else if (data.added === 0) {
      showToast('All default questions already exist in the bank.', 'info');
    } else {
      showToast(`Added ${data.added} default question(s).`, 'success');
      await loadQuestions();
    }
  } catch (err) {
    showToast('Restore failed: ' + err.message, 'danger');
  } finally {
    restoreSeedBtn.disabled = false;
    restoreSeedBtn.textContent = orig;
  }
}

async function generateImageForQuestion(id, btn) {
  const ok = await showConfirm({
    title: 'Generate AI image',
    body: 'Use Gemini to create an illustration for this question? This will replace any current image or emoji.',
    okText: 'Generate'
  });
  if (!ok) return;
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⌛';
  try {
    const res  = await fetch(`/api/admin/questions/${id}/generate-image`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok || data.error) {
      showToast('Image generation failed: ' + (data.error || 'unknown error'), 'danger');
    } else {
      showToast('Image generated.', 'success');
      await loadQuestions();
    }
  } catch (err) {
    showToast('Image generation failed: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

/* ─── QUESTION FORM MODAL ─── */
function openQuestionModal(question) {
  state.editingQuestion = question;
  state.formImageDataUrl = null;

  fqTitle.textContent = question ? 'Edit Question' : 'Add Question';
  refreshTopicDatalist();

  if (question) {
    fqTopic.value = question.topic || '';
    fqType.value = question.type || 'image_to_word';
    fqQuestion.value = question.question_en || '';
    fqEmoji.value = question.emoji || '';
    fqImageUrl.value = (question.imageUrl && !question.imageUrl.startsWith('data:')) ? question.imageUrl : '';
    state.formImageDataUrl = (question.imageUrl && question.imageUrl.startsWith('data:')) ? question.imageUrl : null;
    fqImageFile.value = '';
    renderOptionRows(question.options || [], question.correctIndex || 0);
  } else {
    fqTopic.value = '';
    fqType.value = 'image_to_word';
    fqQuestion.value = '';
    fqEmoji.value = '';
    fqImageUrl.value = '';
    fqImageFile.value = '';
    renderOptionRows([], 0);
  }
  renderImagePreview();
  questionModal.show();
}

function refreshTopicDatalist() {
  fqTopicSuggest.innerHTML = '';
  state.topics.forEach(t => {
    const o = document.createElement('option');
    o.value = t;
    fqTopicSuggest.appendChild(o);
  });
}

function renderOptionRows(opts, correctIdx = 0) {
  fqOptionsWrap.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const o = opts[i] || { chinese: '', pinyin: '', zhuyin: '', english: '' };
    const row = document.createElement('div');
    row.className = 'option-row' + (i === correctIdx ? ' correct' : '');
    row.dataset.idx = i;
    row.innerHTML = `
      <button type="button" class="opt-tag" title="Click to mark as the correct answer">${i === correctIdx ? '✓' : i + 1}</button>
      <input class="form-control form-control-sm opt-chinese-input" placeholder="繁體 Chinese" value="${escapeAttr(o.chinese)}" />
      <input class="form-control form-control-sm opt-pinyin-input"  placeholder="pinyin (auto)" value="${escapeAttr(o.pinyin)}" />
      <input class="form-control form-control-sm opt-zhuyin-input"  placeholder="注音 (auto)" value="${escapeAttr(o.zhuyin)}" />
      <input class="form-control form-control-sm opt-english-input opt-english-field" placeholder="English" value="${escapeAttr(o.english)}" />`;
    row.querySelector('.opt-tag').addEventListener('click', () => setCorrectOption(i));
    fqOptionsWrap.appendChild(row);
  }
}

function setCorrectOption(idx) {
  fqOptionsWrap.querySelectorAll('.option-row').forEach((row, i) => {
    const tag = row.querySelector('.opt-tag');
    if (i === idx) {
      row.classList.add('correct');
      tag.textContent = '✓';
    } else {
      row.classList.remove('correct');
      tag.textContent = i + 1;
    }
  });
}

function renderImagePreview() {
  const url = state.formImageDataUrl || fqImageUrl.value.trim();
  const emoji = fqEmoji.value.trim();
  fqImagePreview.innerHTML = '';
  if (url) {
    fqImagePreview.innerHTML = `<img src="${escapeAttr(url)}" alt="" /><span class="vp-hint">${state.formImageDataUrl ? 'Uploaded file (compressed, embedded inline).' : 'From URL.'}</span>`;
  } else if (emoji) {
    fqImagePreview.innerHTML = `<span class="vp-emoji">${escapeHtml(emoji)}</span><span class="vp-hint">Emoji preview.</span>`;
  } else {
    fqImagePreview.innerHTML = `<span class="vp-hint">Enter an emoji, paste an image URL, or upload a file.</span>`;
  }
}

async function handleImageFileSelect() {
  const file = fqImageFile.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) {
    showToast('File too large (max 4 MB). Use a smaller image.', 'warning');
    fqImageFile.value = '';
    return;
  }
  try {
    const dataUrl = await compressImage(file, 600);
    state.formImageDataUrl = dataUrl;
    fqImageUrl.value = '';
    renderImagePreview();
  } catch (err) {
    showToast('Could not process image: ' + err.message, 'danger');
    fqImageFile.value = '';
  }
}

function compressImage(file, maxDim) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function collectFormData() {
  const optionRows = [...fqOptionsWrap.querySelectorAll('.option-row')];
  const options = optionRows.map(row => ({
    chinese: row.querySelector('.opt-chinese-input').value.trim(),
    pinyin:  row.querySelector('.opt-pinyin-input').value.trim(),
    zhuyin:  row.querySelector('.opt-zhuyin-input').value.trim(),
    english: row.querySelector('.opt-english-input').value.trim()
  }));

  // Whichever row has the .correct class is the answer
  let correctIndex = optionRows.findIndex(r => r.classList.contains('correct'));
  if (correctIndex < 0) correctIndex = 0;

  const imageUrl = state.formImageDataUrl || fqImageUrl.value.trim() || '';

  return {
    topic:        fqTopic.value.trim(),
    type:         fqType.value,
    question_en:  fqQuestion.value.trim(),
    emoji:        fqEmoji.value.trim(),
    imageUrl,
    answer:       options[correctIndex],
    options,
    correctIndex
  };
}

function validateFormData(d) {
  if (!d.topic) return 'Topic is required.';
  if (!d.question_en) return 'English prompt is required.';
  if (d.type === 'image_to_word' && !d.imageUrl && !d.emoji) {
    return 'Picture-type questions need either an emoji, image URL, or uploaded image.';
  }
  for (let i = 0; i < 4; i++) {
    const o = d.options[i];
    // Pinyin and zhuyin are auto-filled by the backend on save when blank,
    // so only Chinese and English are user-required here.
    if (!o.chinese || !o.english) {
      return `Option ${i + 1} is incomplete — Chinese and English are required.`;
    }
  }
  return null;
}

async function saveQuestionForm() {
  const data = collectFormData();
  const err = validateFormData(data);
  if (err) { showToast(err, 'warning'); return; }

  fqSave.disabled = true;
  fqSave.textContent = 'Saving…';

  try {
    const editing = state.editingQuestion;
    const url = editing ? `/api/admin/questions/${editing.id}` : '/api/admin/questions';
    const method = editing ? 'PATCH' : 'POST';
    const body = editing ? data : { questions: [data] };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await res.json();

    if (!res.ok || result.error) {
      showToast('Save failed: ' + (result.error || 'unknown error'), 'danger');
      return;
    }

    questionModal.hide();
    if (data.topic && !state.expandedTopics.has(data.topic)) state.expandedTopics.add(data.topic);
    await loadQuestions();
    showToast(editing ? 'Question updated.' : 'Question added.', 'success');
  } catch (e) {
    showToast('Save failed: ' + e.message, 'danger');
  } finally {
    fqSave.disabled = false;
    fqSave.textContent = 'Save';
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
    if (state.selectedStudent) loadStudentDetail(state.selectedStudent);
  } catch {
    studentList.innerHTML = '<div class="text-muted text-center py-3">Failed to load students.</div>';
  }
}

function populateTargetStudentDropdown() {
  const current = targetStudent.value;
  while (targetStudent.options.length > 1) targetStudent.remove(1);
  state.students.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.name;
    opt.textContent = s.name + (s.averageScore !== null ? ` (avg ${s.averageScore}%)` : ' (new)');
    targetStudent.appendChild(opt);
  });
  if (current && state.students.some(s => s.name === current)) targetStudent.value = current;
}

function renderAssignTopicPicker() {
  if (state.topics.length === 0) {
    assignTopics.innerHTML = '<span class="chip-empty">No topics yet — generate or add some questions first.</span>';
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
  if (!name) { showToast('Enter a student name first.', 'warning'); return; }
  if (state.assignTopicsPicked.size === 0) { showToast('Pick at least one topic.', 'warning'); return; }

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
      assignName.value = ''; assignNotes.value = '';
      state.assignTopicsPicked.clear();
      renderAssignTopicPicker();
      await loadStudents();
      const match = state.students.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (match) selectStudent(match.name);
      showToast(`Assignment created for ${data.assignment.studentName}.`, 'success');
    }
  } catch { showToast('Failed to create assignment.', 'danger'); }
}

function renderStudentList() {
  const filter = studentFilter.value.trim().toLowerCase();
  const shown = filter
    ? state.students.filter(s => s.name.toLowerCase().includes(filter))
    : state.students;

  if (shown.length === 0) {
    studentList.innerHTML = `<div class="text-muted small p-3 text-center">${filter ? 'No matching students.' : 'No students yet.'}</div>`;
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
  studentDetailBox.innerHTML = '<div class="card-body"><div class="text-muted text-center py-4">Loading…</div></div>';
  try {
    const res = await fetch(`/api/admin/students/${encodeURIComponent(name)}`);
    state.studentDetail = await res.json();
    renderStudentDetail();
  } catch {
    studentDetailBox.innerHTML = '<div class="card-body"><div class="empty-state">Failed to load student details.</div></div>';
  }
}

function renderStudentDetail() {
  const d = state.studentDetail;
  if (!d) return;

  const totalTests = d.results.length;
  const avg = totalTests === 0 ? null :
    Math.round(d.results.reduce((s, r) => s + r.percentage, 0) / totalTests);

  let html = `<div class="card-body">
    <h3>${escapeHtml(d.name)}</h3>
    <p class="detail-sub">${totalTests} test${totalTests !== 1 ? 's' : ''} taken${avg !== null ? ` · average ${avg}%` : ''}</p>`;

  html += `<div class="detail-section">
    <h4>Active Assignments (${d.assignments.length})</h4>`;
  if (d.assignments.length === 0) {
    html += '<p class="text-muted small">No assignments yet.</p>';
  } else {
    d.assignments.forEach(a => {
      const date = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      html += `
        <div class="assignment-card">
          <div class="flex-grow-1">
            <div class="ac-topics">${escapeHtml(a.topics.join(' · '))}</div>
            <div class="ac-meta">${a.questionCount} questions · ${date}${a.notes ? ' · ' + escapeHtml(a.notes) : ''}</div>
          </div>
          <button class="icon-btn danger" type="button" data-aid="${escapeHtml(a.id)}">Remove</button>
        </div>`;
    });
  }
  html += '</div>';

  html += `<div class="detail-section">
    <h4>Most-Missed Words (${d.wrongAnswers.length})</h4>`;
  if (d.wrongAnswers.length === 0) {
    html += '<p class="text-muted small">No wrong answers — nice work!</p>';
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
      html += `<p class="text-muted small mt-2">+ ${d.wrongAnswers.length - 15} more</p>`;
    }
    html += '</div>';
  }
  html += '</div>';

  html += `<div class="detail-section">
    <h4>Test History (${d.results.length})</h4>`;
  if (d.results.length === 0) {
    html += '<p class="text-muted small">No test attempts yet.</p>';
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
  html += '</div></div>';

  studentDetailBox.innerHTML = html;

  studentDetailBox.querySelectorAll('[data-aid]').forEach(btn => {
    btn.addEventListener('click', () => removeAssignment(btn.dataset.aid));
  });
}

async function removeAssignment(aid) {
  const ok = await showConfirm({ title: 'Remove assignment', body: 'Remove this assignment from the student?', okText: 'Remove', danger: true });
  if (!ok) return;
  try {
    await fetch(`/api/admin/assignments/${aid}`, { method: 'DELETE' });
    await loadStudents();
    showToast('Assignment removed.', 'success');
  } catch { showToast('Failed to remove assignment.', 'danger'); }
}

/* ─── ALL RESULTS TAB ─── */
async function loadResults() {
  try {
    const res = await fetch('/api/admin/results');
    state.results = await res.json();
    renderResults();
  } catch {
    resultsTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Failed to load results.</td></tr>';
  }
}

function computeSummary(results) {
  if (results.length === 0) return { totalTests: 0, averageScore: 0, topicBreakdown: {} };
  const totalTests = results.length;
  const averageScore = Math.round(
    results.reduce((s, r) => s + (r.percentage || 0), 0) / totalTests
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
    <div class="col-6 col-md-3 col-summary">
      <div class="summary-card">
        <span class="sc-value">${summary.totalTests}</span>
        <div class="sc-label">${escapeHtml(testsLabel)}</div>
      </div>
    </div>
    <div class="col-6 col-md-3 col-summary">
      <div class="summary-card">
        <span class="sc-value">${summary.totalTests > 0 ? summary.averageScore + '%' : '—'}</span>
        <div class="sc-label">${escapeHtml(avgLabel)}</div>
      </div>
    </div>`;

  topicList.forEach(([topic, data]) => {
    html += `
      <div class="col-6 col-md-3 col-summary">
        <div class="summary-card">
          <span class="sc-value">${data.averageScore}%</span>
          <div class="sc-label">${escapeHtml(topic)} avg</div>
        </div>
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

  let displayName = null;
  if (filterRaw) {
    const uniqueNames = [...new Set(shown.map(r => r.studentName))];
    displayName = uniqueNames.length === 1 ? uniqueNames[0] : filterRaw;
  }

  renderSummary(computeSummary(shown), displayName);

  if (shown.length === 0) {
    resultsTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">${filter ? `No results for "${escapeHtml(filterRaw)}" yet.` : 'No results yet.'}</td></tr>`;
    return;
  }

  resultsTbody.innerHTML = shown.map(r => {
    const pillClass = r.percentage >= 80 ? 'score-high' : r.percentage >= 50 ? 'score-mid' : 'score-low';
    const dateStr   = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr   = new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const duration  = r.duration ? formatDuration(r.duration) : '—';
    return `<tr>
      <td data-label="Student"><strong>${escapeHtml(r.studentName)}</strong></td>
      <td data-label="Topic">${escapeHtml(r.topic)}</td>
      <td data-label="Score">${r.score} / ${r.total}</td>
      <td data-label="%"><span class="score-pill ${pillClass}">${r.percentage}%</span></td>
      <td data-label="Duration">${duration}</td>
      <td data-label="Date" title="${timeStr}">${dateStr}</td>
      <td data-label="" class="col-actions"><button class="row-delete" data-rid="${escapeHtml(r.id)}" type="button" title="Delete">✕</button></td>
    </tr>`;
  }).join('');

  resultsTbody.querySelectorAll('.row-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteOneResult(btn.dataset.rid));
  });
}

async function deleteOneResult(id) {
  const target = state.results.find(r => r.id === id);
  const label = target ? `${target.studentName} · ${target.topic} (${target.percentage}%)` : 'this record';
  const ok = await showConfirm({ title: 'Delete result', body: `Delete ${label}?`, okText: 'Delete', danger: true });
  if (!ok) return;
  try {
    const res = await fetch(`/api/admin/results/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast('Failed: ' + (data.error || 'unknown error'), 'danger');
      return;
    }
    state.results = state.results.filter(r => r.id !== id);
    renderResults();
    showToast('Result deleted.', 'success');
  } catch (err) { showToast('Failed: ' + err.message, 'danger'); }
}

async function clearResults() {
  const ok = await showConfirm({
    title: 'Clear all results',
    body: 'Delete EVERY student result? This cannot be undone.',
    okText: 'Delete all', danger: true
  });
  if (!ok) return;
  try {
    await fetch('/api/admin/results', { method: 'DELETE' });
    await loadResults();
    await loadStudents();
    showToast('All results cleared.', 'success');
  } catch { showToast('Failed to clear results.', 'danger'); }
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
function escapeAttr(str) { return escapeHtml(str); }

/* ─── Start ─── */
init();
