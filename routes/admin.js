const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { read, write } = require('../utils/database');

const router = express.Router();

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
