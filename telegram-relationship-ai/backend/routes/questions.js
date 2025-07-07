const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Получение всех вопросов
router.get('/', async (req, res) => {
  try {
    const questions = await db.questions.getAllQuestions();
    
    res.json({
      success: true,
      questions: questions
    });
    
  } catch (error) {
    console.error('Questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение конкретного вопроса по ID
router.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const questions = await db.questions.getAllQuestions();
    const question = questions.find(q => q.id === parseInt(questionId));
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({
      success: true,
      question: question
    });
    
  } catch (error) {
    console.error('Question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;