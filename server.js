require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Bumped from default 100kb so admin can save questions with embedded base64 image uploads
app.use(express.json({ limit: '4mb' }));

app.use('/student', express.static(path.join(__dirname, 'public/student')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => res.redirect('/student'));

// Only listen when run directly (not when required by Vercel serverless wrapper)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n✅ Chinese Quiz App is running!\n');
    console.log(`  🎓 Student page: http://localhost:${PORT}/student`);
    console.log(`  👩‍🏫 Admin page:   http://localhost:${PORT}/admin\n`);
  });
}

module.exports = app;
