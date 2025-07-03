const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Сохранение ответа на вопрос
router.post('/', async (req, res) => {
  try {
    const { userId, questionId, answer } = req.body;
    
    if (!userId || !questionId || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Вычисляем баллы на основе ответа
    const score = calculateScore(questionId, answer);
    
    // Сохраняем ответ
    const answerId = await db.answers.saveAnswer(userId, questionId, answer, score);
    
    res.json({
      success: true,
      answer_id: answerId,
      score: score
    });
    
  } catch (error) {
    console.error('Answer save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение ответов пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const answers = await db.answers.getUserAnswers(userId);
    
    res.json({
      success: true,
      answers: answers
    });
    
  } catch (error) {
    console.error('Answers get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Функция для вычисления баллов
function calculateScore(questionId, answer) {
  // Система оценки для определения архетипа
  const scoringSystem = {
    1: { // Любовь vs финансы
      'Любовь превыше всего': { romantic: 3 },
      'Финансовая стабильность важнее': { strategist: 3 },
      'Нужен баланс между ними': { strategist: 2, romantic: 1 },
      'Сначала стабильность, потом любовь': { strategist: 3, avoidant: 1 }
    },
    2: { // Сближение vs отдаление
      'Всегда стремлюсь к близости': { romantic: 3 },
      'Часто отдаляюсь': { avoidant: 3 },
      'Зависит от настроения': { seeker: 2 },
      'Сначала сближаюсь, потом отдаляюсь': { avoidant: 2, seeker: 1 }
    },
    3: { // Отношения без страсти
      'Никогда': { romantic: 3 },
      'Да, если есть любовь': { romantic: 2, strategist: 1 },
      'Только ради детей/семьи': { strategist: 3 },
      'Страсть не главное': { strategist: 2, avoidant: 1 }
    },
    4: { // Вера в любовь
      'Абсолютно верю': { romantic: 3 },
      'Скорее да, чем нет': { romantic: 2 },
      'Скорее нет, чем да': { avoidant: 2 },
      'Это выдумка': { avoidant: 3 }
    },
    5: { // Сильный партнёр
      'Да, хочу опору': { romantic: 2, seeker: 1 },
      'Нет, предпочитаю равенство': { strategist: 2 },
      'Хочу быть сильнее': { avoidant: 2 },
      'Не важно': { seeker: 2 }
    },
    6: { // Готовность меняться
      'Готов кардинально измениться': { romantic: 3 },
      'Готов на компромиссы': { strategist: 2, romantic: 1 },
      'Минимальные изменения': { avoidant: 2 },
      'Не буду меняться': { avoidant: 3 }
    },
    7: { // Страх отвержения
      'Очень боюсь': { romantic: 2, seeker: 1 },
      'Немного волнует': { romantic: 1, seeker: 1 },
      'Редко думаю об этом': { strategist: 2 },
      'Совсем не боюсь': { avoidant: 2, strategist: 1 }
    }
  };
  
  const questionScores = scoringSystem[questionId];
  if (!questionScores || !questionScores[answer]) {
    return 0;
  }
  
  // Возвращаем суммарный балл для ответа
  const answerScores = questionScores[answer];
  return Object.values(answerScores).reduce((sum, score) => sum + score, 0);
}

module.exports = router;