const express = require('express');
const { chatWithAI } = require('../utils/aiHelper');

const router = express.Router();

router.post('/chat', async (req, res) => {
  const { message, conversationHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const responseText = await chatWithAI(message, conversationHistory || []);

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
