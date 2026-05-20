const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { read, write } = require('../utils/database');

const router = express.Router();

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

module.exports = router;
