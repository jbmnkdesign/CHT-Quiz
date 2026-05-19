const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { read, write } = require('../utils/database');

const router = express.Router();

router.get('/topics', async (req, res) => {
  try {
    const questions = await read('questions');
    const topics = [...new Set(questions.map(q => q.topic))].sort();
    res.json(topics);
  } catch (err) {
    console.error('GET /topics error:', err);
    res.status(500).json({ error: 'Failed to load topics' });
  }
});

router.get('/questions', async (req, res) => {
  try {
    const { topic, limit = 10 } = req.query;
    let questions = await read('questions');

    if (topic && topic !== 'all') {
      questions = questions.filter(
        q => q.topic.toLowerCase() === topic.toLowerCase()
      );
    }

    questions = questions.sort(() => Math.random() - 0.5).slice(0, parseInt(limit));
    res.json(questions);
  } catch (err) {
    console.error('GET /questions error:', err);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

router.post('/results', async (req, res) => {
  try {
    const { studentName, topic, score, total, answers, duration } = req.body;

    if (!studentName || score === undefined || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const results = await read('results');
    const newResult = {
      id: uuidv4(),
      studentName: studentName.trim(),
      topic: topic || 'Mixed',
      score,
      total,
      percentage: Math.round((score / total) * 100),
      answers: answers || [],
      duration: duration || 0,
      timestamp: new Date().toISOString()
    };

    results.push(newResult);
    await write('results', results);

    res.json({ success: true, result: newResult });
  } catch (err) {
    console.error('POST /results error:', err);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

module.exports = router;
