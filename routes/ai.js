const express = require('express');
const { chatWithAI } = require('../utils/aiHelper');
const { read } = require('../utils/database');

const router = express.Router();

router.post('/chat', async (req, res) => {
  const { message, conversationHistory, studentName } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    let augmentedMessage = message;

    // If teacher targeted a specific student, inject their recent wrong answers
    if (studentName) {
      const results = await read('results');
      const wrongAnswers = results
        .filter(r => r.studentName && r.studentName.toLowerCase() === studentName.toLowerCase())
        .flatMap(r => r.answers || [])
        .filter(a => !a.correct);

      const recent = wrongAnswers.slice(-25);

      if (recent.length > 0) {
        const seen = new Set();
        const unique = [];
        for (const a of recent) {
          const key = (a.chinese || '') + '|' + (a.english || '');
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(a);
          }
        }
        const missedList = unique
          .map(a => `${a.chinese} (${a.pinyin}, ${a.english})`)
          .join(', ');

        augmentedMessage = `Student context: ${studentName} has missed these words recently: [${missedList}]\n\nTeacher's request: ${message}`;
      }
    }

    const responseText = await chatWithAI(augmentedMessage, conversationHistory || []);

    let questions = null;
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      try {
        questions = JSON.parse(jsonMatch[0]);
      } catch {
        // Response was not parseable JSON questions
      }
    }

    res.json({ response: responseText, questions });
  } catch (error) {
    console.error('AI error:', error.message);
    res.status(500).json({ error: 'AI request failed: ' + error.message });
  }
});

module.exports = router;
