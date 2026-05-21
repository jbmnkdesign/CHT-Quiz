const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { read, write } = require('../utils/database');
const { generateText, generateImage } = require('../utils/aiHelper');
const { seedQuestions } = require('../utils/seedData');

const router = express.Router();

const PHONETICS_SYSTEM = `You are a Chinese phonetics expert. Provide BOTH pinyin (with tone diacritics) AND zhuyin (注音符號 / Bopomofo) for Traditional Chinese words.

Rules:
- Pinyin: standard Hanyu Pinyin with tone diacritics (ā á ǎ à, ē é ě è, ī í ǐ ì, ō ó ǒ ò, ū ú ǔ ù, ǖ ǘ ǚ ǜ). No tone numbers.
- Zhuyin: SPACE between each syllable. Tone marks: 1st = no mark, 2nd = ˊ, 3rd = ˇ, 4th = ˋ, neutral = ˙ before the syllable.
- Examples:
  - 貓 → pinyin: "māo", zhuyin: "ㄇㄚ"
  - 馬 → pinyin: "mǎ", zhuyin: "ㄇㄚˇ"
  - 謝謝 → pinyin: "xièxiè", zhuyin: "ㄒㄧㄝˋ ㄒㄧㄝˋ"
  - 學校 → pinyin: "xuéxiào", zhuyin: "ㄒㄩㄝˊ ㄒㄧㄠˋ"
  - 桌子 → pinyin: "zhuōzi", zhuyin: "ㄓㄨㄛ ˙ㄗ"
  - 對不起 → pinyin: "duìbuqǐ", zhuyin: "ㄉㄨㄟˋ ˙ㄅㄨ ㄑㄧˇ"

Respond ONLY with a JSON object — no markdown fences, no surrounding text.`;

// Scan a question array, ask Gemini for pinyin AND zhuyin on any word missing either, mutate in place.
async function fillMissingPhonetics(questions) {
  const missing = new Map(); // chinese -> { chinese, existingPinyin }
  const collect = (w) => {
    if (!w || !w.chinese) return;
    if (w.pinyin && w.zhuyin) return; // both already present
    if (!missing.has(w.chinese)) {
      missing.set(w.chinese, { chinese: w.chinese, existingPinyin: w.pinyin || '' });
    }
  };
  for (const q of questions) {
    collect(q.answer);
    for (const opt of (q.options || [])) collect(opt);
  }

  if (missing.size === 0) {
    return { uniqueMissing: 0, mapped: 0, updatedFields: 0 };
  }

  const list = [...missing.values()];
  const lines = list.map(w =>
    w.existingPinyin
      ? `${w.chinese} (current pinyin: ${w.existingPinyin})`
      : w.chinese
  );

  const prompt = `Provide pinyin and zhuyin for each Traditional Chinese word. Return ONLY a JSON object whose keys are the chinese strings.

Words:
${lines.join('\n')}

Expected response shape (no other text):
{
  "貓":    { "pinyin": "māo",   "zhuyin": "ㄇㄚ" },
  "學校":  { "pinyin": "xuéxiào", "zhuyin": "ㄒㄩㄝˊ ㄒㄧㄠˋ" }
}`;

  const aiText = await generateText(prompt, PHONETICS_SYSTEM);
  let mapping = {};
  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { mapping = JSON.parse(jsonMatch[0]); } catch { /* keep empty */ }
  }

  let updatedFields = 0;
  const apply = (w) => {
    if (!w || !w.chinese) return;
    const m = mapping[w.chinese];
    if (!m || typeof m !== 'object') return;
    if (!w.pinyin && m.pinyin) { w.pinyin = m.pinyin; updatedFields++; }
    if (!w.zhuyin && m.zhuyin) { w.zhuyin = m.zhuyin; updatedFields++; }
  };
  for (const q of questions) {
    apply(q.answer);
    for (const opt of (q.options || [])) apply(opt);
  }

  return {
    uniqueMissing: missing.size,
    mapped: Object.keys(mapping).length,
    updatedFields
  };
}

// Randomise the position of the correct answer among the options.
// Keeps q.answer pointing to the same word; just shuffles q.options and updates q.correctIndex.
function shuffleQuestionOptions(q) {
  if (!Array.isArray(q.options) || q.options.length < 2) return q;
  const correctOption = q.options[q.correctIndex] || q.answer;
  if (!correctOption) return q;
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);
  const newIdx = shuffled.findIndex(o =>
    o === correctOption ||
    (o.chinese === correctOption.chinese && o.english === correctOption.english)
  );
  q.options = shuffled;
  q.correctIndex = newIdx >= 0 ? newIdx : 0;
  q.answer = q.options[q.correctIndex];
  return q;
}

/* ────────────────────────── QUESTIONS ────────────────────────── */

router.get('/questions', async (req, res) => {
  try {
    res.json(await read('questions'));
  } catch (err) {
    console.error('GET /admin/questions error:', err);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid questions format' });
    }

    const existing = await read('questions');
    const newQuestions = questions.map(q => ({
      id: uuidv4(),
      ...q,
      createdAt: new Date().toISOString()
    }));

    // Safety net: AI is supposed to include pinyin + zhuyin in every word, but if it
    // slips up we silently fill in the missing values before saving.
    try {
      await fillMissingPhonetics(newQuestions);
    } catch (e) {
      console.warn('Phonetics auto-fill failed during save, continuing without it:', e.message);
    }

    // Randomise correct-answer position so it isn't always option 1
    newQuestions.forEach(shuffleQuestionOptions);

    await write('questions', [...existing, ...newQuestions]);
    res.json({ success: true, count: newQuestions.length, questions: newQuestions });
  } catch (err) {
    console.error('POST /admin/questions error:', err);
    res.status(500).json({ error: 'Failed to save questions' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const questions = await read('questions');
    await write('questions', questions.filter(q => q.id !== req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/questions error:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Edit an existing question — caller sends the full updated question body.
// Runs zhuyin auto-fill if any words are missing it.
router.patch('/questions/:id', async (req, res) => {
  try {
    const update = req.body;
    if (!update || typeof update !== 'object') {
      return res.status(400).json({ error: 'Invalid update body' });
    }

    const questions = await read('questions');
    const idx = questions.findIndex(q => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Question not found' });

    const original = questions[idx];
    const merged = {
      ...original,
      ...update,
      id: original.id,
      createdAt: original.createdAt,
      updatedAt: new Date().toISOString()
    };

    // Safety net: fill any missing pinyin/zhuyin via AI before saving
    try {
      await fillMissingPhonetics([merged]);
    } catch (e) {
      console.warn('Phonetics auto-fill failed during edit:', e.message);
    }
    // Edits respect the order the teacher chose; we only sync the answer reference.
    if (Array.isArray(merged.options) && merged.options[merged.correctIndex]) {
      merged.answer = merged.options[merged.correctIndex];
    }

    questions[idx] = merged;
    await write('questions', questions);
    res.json({ success: true, question: merged });
  } catch (err) {
    console.error('PATCH /admin/questions/:id error:', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

/* ────────────────────────── TOPICS ────────────────────────── */

// Rename a topic across ALL questions
router.patch('/topics', async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ error: 'oldName and newName required' });
    }
    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      return res.status(400).json({ error: 'newName cannot be empty' });
    }

    const questions = await read('questions');
    let updated = 0;
    const next = questions.map(q => {
      if (q.topic === oldName) {
        updated++;
        return { ...q, topic: trimmedNew };
      }
      return q;
    });
    await write('questions', next);
    res.json({ success: true, updated });
  } catch (err) {
    console.error('PATCH /admin/topics error:', err);
    res.status(500).json({ error: 'Failed to rename topic' });
  }
});

// Delete an entire topic and all its questions
router.delete('/topics/:name', async (req, res) => {
  try {
    const target = decodeURIComponent(req.params.name);
    const questions = await read('questions');
    const remaining = questions.filter(q => q.topic !== target);
    const removed = questions.length - remaining.length;
    await write('questions', remaining);
    res.json({ success: true, removed });
  } catch (err) {
    console.error('DELETE /admin/topics error:', err);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// One-shot AI backfill button. Fills BOTH pinyin and zhuyin on any question word missing either.
router.post('/backfill-zhuyin', async (req, res) => {
  try {
    const questions = await read('questions');
    const result = await fillMissingPhonetics(questions);

    if (result.updatedFields > 0) {
      await write('questions', questions);
    }

    res.json({
      success: true,
      scanned: questions.length,
      uniqueMissing: result.uniqueMissing,
      mapped: result.mapped,
      updatedFields: result.updatedFields
    });
  } catch (err) {
    console.error('POST /admin/backfill-zhuyin error:', err);
    res.status(500).json({ error: 'Failed to backfill phonetics: ' + err.message });
  }
});

// Tiny status endpoint so the admin UI can hide the "Restore Defaults"
// button when every seed question is already in the bank.
router.get('/restore-seed/status', async (req, res) => {
  try {
    const existing = await read('questions');
    const existingIds = new Set(existing.map(q => q.id));
    const missing = seedQuestions.filter(q => !existingIds.has(q.id)).length;
    res.json({ total: seedQuestions.length, missing });
  } catch (err) {
    console.error('GET /admin/restore-seed/status error:', err);
    res.status(500).json({ error: 'Failed to load seed status' });
  }
});

// Restore the default starter pack: adds any seed questions whose ids are missing from the DB.
// Idempotent — won't duplicate questions you already have.
router.post('/restore-seed', async (req, res) => {
  try {
    const existing = await read('questions');
    const existingIds = new Set(existing.map(q => q.id));
    // Deep-copy + shuffle each seed question's options so the correct answer
    // isn't always the first option.
    const missing = seedQuestions
      .filter(q => !existingIds.has(q.id))
      .map(q => shuffleQuestionOptions(JSON.parse(JSON.stringify(q))));
    if (missing.length === 0) {
      return res.json({ success: true, added: 0 });
    }
    await write('questions', [...existing, ...missing]);
    res.json({ success: true, added: missing.length });
  } catch (err) {
    console.error('POST /admin/restore-seed error:', err);
    res.status(500).json({ error: 'Failed to restore seed: ' + err.message });
  }
});

// Reshuffle the option order for every existing question so the correct answer
// is spread across all four positions. Idempotent (running it again just
// re-randomises). Used to fix legacy data where correctIndex was always 0.
router.post('/shuffle-correct-positions', async (req, res) => {
  try {
    const questions = await read('questions');
    questions.forEach(shuffleQuestionOptions);
    await write('questions', questions);
    res.json({ success: true, shuffled: questions.length });
  } catch (err) {
    console.error('POST /admin/shuffle-correct-positions error:', err);
    res.status(500).json({ error: 'Failed to shuffle: ' + err.message });
  }
});

// Generate an AI image for a single question and attach it as imageUrl.
router.post('/questions/:id/generate-image', async (req, res) => {
  try {
    const questions = await read('questions');
    const idx = questions.findIndex(q => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Question not found' });

    const q = questions[idx];
    const answerEn = q.answer?.english || '';
    const answerCn = q.answer?.chinese || '';
    if (!answerEn) return res.status(400).json({ error: 'Question has no English answer to base an image on' });

    const prompt = `A simple, friendly cartoon illustration of: ${answerEn} (${answerCn}). Bright vibrant colors, white background, no text or letters in the image, suitable for a 12-year-old beginner Chinese learner.`;

    const dataUrl = await generateImage(prompt);
    q.imageUrl = dataUrl;
    q.updatedAt = new Date().toISOString();
    await write('questions', questions);

    res.json({ success: true, imageUrl: dataUrl });
  } catch (err) {
    console.error('POST /admin/questions/:id/generate-image error:', err);
    res.status(500).json({ error: 'Image generation failed: ' + err.message });
  }
});

/* ────────────────────────── ASSIGNMENTS ────────────────────────── */

router.get('/assignments', async (req, res) => {
  try {
    const assignments = await read('assignments');
    assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(assignments);
  } catch (err) {
    console.error('GET /admin/assignments error:', err);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const { studentName, topics, questionCount, notes } = req.body;
    if (!studentName || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: 'studentName and topics[] are required' });
    }

    const assignments = await read('assignments');
    const newAssignment = {
      id: uuidv4(),
      studentName: studentName.trim(),
      topics: topics.map(t => String(t).trim()).filter(Boolean),
      questionCount: parseInt(questionCount) || 10,
      notes: (notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    assignments.push(newAssignment);
    await write('assignments', assignments);
    res.json({ success: true, assignment: newAssignment });
  } catch (err) {
    console.error('POST /admin/assignments error:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignments = await read('assignments');
    await write('assignments', assignments.filter(a => a.id !== req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/assignments error:', err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

/* ────────────────────────── STUDENTS ────────────────────────── */

// Distinct student list with summary stats
router.get('/students', async (req, res) => {
  try {
    const [results, assignments] = await Promise.all([
      read('results'),
      read('assignments')
    ]);

    const map = new Map();

    // From results
    for (const r of results) {
      if (!r.studentName) continue;
      const key = r.studentName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: r.studentName,
          tests: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          lastActive: null,
          assignmentCount: 0
        });
      }
      const s = map.get(key);
      s.tests++;
      s.totalCorrect += r.score || 0;
      s.totalQuestions += r.total || 0;
      const ts = new Date(r.timestamp);
      if (!s.lastActive || ts > new Date(s.lastActive)) s.lastActive = r.timestamp;
    }

    // From assignments (students who exist only because teacher assigned to them)
    for (const a of assignments) {
      if (!a.studentName) continue;
      const key = a.studentName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: a.studentName,
          tests: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          lastActive: null,
          assignmentCount: 0
        });
      }
      map.get(key).assignmentCount++;
    }

    const students = [...map.values()].map(s => ({
      ...s,
      averageScore: s.totalQuestions > 0
        ? Math.round((s.totalCorrect / s.totalQuestions) * 100)
        : null
    }));
    students.sort((a, b) => a.name.localeCompare(b.name));
    res.json(students);
  } catch (err) {
    console.error('GET /admin/students error:', err);
    res.status(500).json({ error: 'Failed to load students' });
  }
});

// Detailed history + wrong-answer analysis for a single student
router.get('/students/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).toLowerCase();
    const [results, assignments] = await Promise.all([
      read('results'),
      read('assignments')
    ]);

    const myResults = results
      .filter(r => r.studentName && r.studentName.toLowerCase() === name)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const myAssignments = assignments
      .filter(a => a.studentName && a.studentName.toLowerCase() === name)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Aggregate wrong answers across all attempts: { chinese, pinyin, english, timesMissed, lastMissed }
    const wrongMap = new Map();
    for (const r of myResults) {
      for (const ans of (r.answers || [])) {
        if (ans.correct) continue;
        const key = (ans.chinese || '') + '|' + (ans.english || '');
        if (!wrongMap.has(key)) {
          wrongMap.set(key, {
            chinese: ans.chinese,
            pinyin: ans.pinyin,
            zhuyin: ans.zhuyin || '',
            english: ans.english,
            topic: ans.topic,
            timesMissed: 0,
            lastMissed: null
          });
        }
        const w = wrongMap.get(key);
        w.timesMissed++;
        if (!w.lastMissed || new Date(r.timestamp) > new Date(w.lastMissed)) {
          w.lastMissed = r.timestamp;
        }
      }
    }

    const wrongAnswers = [...wrongMap.values()]
      .sort((a, b) => b.timesMissed - a.timesMissed);

    res.json({
      name: myResults[0]?.studentName || myAssignments[0]?.studentName || req.params.name,
      results: myResults,
      assignments: myAssignments,
      wrongAnswers
    });
  } catch (err) {
    console.error('GET /admin/students/:name error:', err);
    res.status(500).json({ error: 'Failed to load student detail' });
  }
});

/* ────────────────────────── RESULTS ────────────────────────── */

router.get('/results', async (req, res) => {
  try {
    const results = await read('results');
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(results);
  } catch (err) {
    console.error('GET /admin/results error:', err);
    res.status(500).json({ error: 'Failed to load results' });
  }
});

router.get('/results/summary', async (req, res) => {
  try {
    const results = await read('results');

    if (results.length === 0) {
      return res.json({ totalTests: 0, averageScore: 0, topicBreakdown: {} });
    }

    const totalTests = results.length;
    const averageScore = Math.round(
      results.reduce((sum, r) => sum + r.percentage, 0) / totalTests
    );

    const topicBreakdown = {};
    results.forEach(r => {
      if (!topicBreakdown[r.topic]) {
        topicBreakdown[r.topic] = { count: 0, totalScore: 0 };
      }
      topicBreakdown[r.topic].count++;
      topicBreakdown[r.topic].totalScore += r.percentage;
    });

    Object.keys(topicBreakdown).forEach(t => {
      topicBreakdown[t].averageScore = Math.round(
        topicBreakdown[t].totalScore / topicBreakdown[t].count
      );
      delete topicBreakdown[t].totalScore;
    });

    res.json({ totalTests, averageScore, topicBreakdown });
  } catch (err) {
    console.error('GET /admin/results/summary error:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

router.delete('/results', async (req, res) => {
  try {
    await write('results', []);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/results error:', err);
    res.status(500).json({ error: 'Failed to clear results' });
  }
});

// Delete a single result by id
router.delete('/results/:id', async (req, res) => {
  try {
    const results = await read('results');
    const next = results.filter(r => r.id !== req.params.id);
    if (next.length === results.length) {
      return res.status(404).json({ error: 'Result not found' });
    }
    await write('results', next);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/results/:id error:', err);
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

module.exports = router;
