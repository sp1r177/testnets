const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Генерация результата анализа
router.post('/generate', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    
    // Получаем ответы пользователя
    const answers = await db.answers.getUserAnswers(userId);
    
    if (answers.length < 7) {
      return res.status(400).json({ error: 'Not all questions answered' });
    }
    
    // Анализируем ответы и определяем архетип
    const analysis = analyzeAnswers(answers);
    
    // Получаем данные архетипа
    const archetype = await db.archetypes.getArchetypeById(analysis.archetypeId);
    
    if (!archetype) {
      return res.status(500).json({ error: 'Archetype not found' });
    }
    
    // Генерируем детальный анализ
    const detailedAnalysis = generateDetailedAnalysis(analysis, archetype, answers);
    
    // Сохраняем результат
    const resultId = await db.results.saveResult(
      userId,
      archetype.name,
      archetype.full_description,
      JSON.stringify(archetype.recommendations),
      JSON.stringify(detailedAnalysis),
      analysis.totalScore
    );
    
    // Отмечаем, что пользователь использовал бесплатный анализ
    await db.users.markFreeAnalysisUsed(userId);
    
    res.json({
      success: true,
      result: {
        id: resultId,
        archetype: archetype.name,
        short_description: archetype.short_description,
        full_description: archetype.full_description,
        strengths: archetype.strengths,
        weaknesses: archetype.weaknesses,
        recommendations: archetype.recommendations,
        detailed_analysis: detailedAnalysis,
        total_score: analysis.totalScore
      }
    });
    
  } catch (error) {
    console.error('Result generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение последнего результата пользователя
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await db.results.getLatestResult(userId);
    
    if (!result) {
      return res.status(404).json({ error: 'No results found' });
    }
    
    // Получаем данные архетипа
    const archetype = await db.archetypes.getArchetypeById(
      ['Романтик', 'Избегающий', 'Стратег', 'Искатель'].indexOf(result.archetype) + 1
    );
    
    res.json({
      success: true,
      result: {
        ...result,
        archetype_data: archetype,
        recommendations: result.recommendations ? JSON.parse(result.recommendations) : [],
        detailed_analysis: result.detailed_analysis ? JSON.parse(result.detailed_analysis) : {}
      }
    });
    
  } catch (error) {
    console.error('Result get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Функция анализа ответов
function analyzeAnswers(answers) {
  const archetypeScores = {
    romantic: 0,
    avoidant: 0,
    strategist: 0,
    seeker: 0
  };
  
  // Система оценки (та же, что в answers.js, но здесь мы подсчитываем итоги)
  const scoringSystem = {
    1: {
      'Любовь превыше всего': { romantic: 3 },
      'Финансовая стабильность важнее': { strategist: 3 },
      'Нужен баланс между ними': { strategist: 2, romantic: 1 },
      'Сначала стабильность, потом любовь': { strategist: 3, avoidant: 1 }
    },
    2: {
      'Всегда стремлюсь к близости': { romantic: 3 },
      'Часто отдаляюсь': { avoidant: 3 },
      'Зависит от настроения': { seeker: 2 },
      'Сначала сближаюсь, потом отдаляюсь': { avoidant: 2, seeker: 1 }
    },
    3: {
      'Никогда': { romantic: 3 },
      'Да, если есть любовь': { romantic: 2, strategist: 1 },
      'Только ради детей/семьи': { strategist: 3 },
      'Страсть не главное': { strategist: 2, avoidant: 1 }
    },
    4: {
      'Абсолютно верю': { romantic: 3 },
      'Скорее да, чем нет': { romantic: 2 },
      'Скорее нет, чем да': { avoidant: 2 },
      'Это выдумка': { avoidant: 3 }
    },
    5: {
      'Да, хочу опору': { romantic: 2, seeker: 1 },
      'Нет, предпочитаю равенство': { strategist: 2 },
      'Хочу быть сильнее': { avoidant: 2 },
      'Не важно': { seeker: 2 }
    },
    6: {
      'Готов кардинально измениться': { romantic: 3 },
      'Готов на компромиссы': { strategist: 2, romantic: 1 },
      'Минимальные изменения': { avoidant: 2 },
      'Не буду меняться': { avoidant: 3 }
    },
    7: {
      'Очень боюсь': { romantic: 2, seeker: 1 },
      'Немного волнует': { romantic: 1, seeker: 1 },
      'Редко думаю об этом': { strategist: 2 },
      'Совсем не боюсь': { avoidant: 2, strategist: 1 }
    }
  };
  
  // Подсчитываем баллы по каждому архетипу
  answers.forEach(answer => {
    const questionScores = scoringSystem[answer.question_id];
    if (questionScores && questionScores[answer.answer]) {
      const answerScores = questionScores[answer.answer];
      Object.keys(answerScores).forEach(archetype => {
        archetypeScores[archetype] += answerScores[archetype];
      });
    }
  });
  
  // Определяем доминирующий архетип
  const maxScore = Math.max(...Object.values(archetypeScores));
  const dominantArchetype = Object.keys(archetypeScores).find(
    key => archetypeScores[key] === maxScore
  );
  
  // Маппинг архетипов к ID
  const archetypeIdMap = {
    romantic: 1,
    avoidant: 2,
    strategist: 3,
    seeker: 4
  };
  
  return {
    archetypeId: archetypeIdMap[dominantArchetype],
    scores: archetypeScores,
    totalScore: Object.values(archetypeScores).reduce((sum, score) => sum + score, 0),
    dominantArchetype
  };
}

// Функция генерации детального анализа
function generateDetailedAnalysis(analysis, archetype, answers) {
  return {
    primary_archetype: archetype.name,
    archetype_percentage: Math.round((analysis.scores[analysis.dominantArchetype] / analysis.totalScore) * 100),
    key_insights: generateKeyInsights(answers, analysis),
    relationship_patterns: generateRelationshipPatterns(answers),
    growth_areas: archetype.recommendations.slice(0, 3),
    compatibility_tips: generateCompatibilityTips(archetype.name),
    next_steps: [
      'Работай над осознанием своих паттернов в отношениях',
      'Практикуй открытое общение с партнёром',
      'Развивай эмоциональный интеллект'
    ]
  };
}

function generateKeyInsights(answers, analysis) {
  const insights = [];
  
  // Анализируем конкретные ответы
  const loveVsStability = answers.find(a => a.question_id === 1);
  if (loveVsStability) {
    if (loveVsStability.answer === 'Любовь превыше всего') {
      insights.push('Ты ставишь эмоциональную связь выше материальной стабильности');
    } else if (loveVsStability.answer === 'Финансовая стабильность важнее') {
      insights.push('Для тебя важна надёжность и стабильность в отношениях');
    }
  }
  
  const intimacyPattern = answers.find(a => a.question_id === 2);
  if (intimacyPattern) {
    if (intimacyPattern.answer === 'Часто отдаляюсь') {
      insights.push('У тебя есть тенденция создавать эмоциональную дистанцию в близких отношениях');
    } else if (intimacyPattern.answer === 'Всегда стремлюсь к близости') {
      insights.push('Ты естественным образом тяготеешь к глубокой эмоциональной близости');
    }
  }
  
  return insights;
}

function generateRelationshipPatterns(answers) {
  const patterns = [];
  
  // Анализируем паттерны на основе ответов
  const passionQuestion = answers.find(a => a.question_id === 3);
  if (passionQuestion && passionQuestion.answer === 'Никогда') {
    patterns.push('Страсть играет ключевую роль в твоих отношениях');
  }
  
  const changeQuestion = answers.find(a => a.question_id === 6);
  if (changeQuestion && changeQuestion.answer === 'Готов кардинально измениться') {
    patterns.push('Ты готов жертвовать собой ради отношений');
  }
  
  return patterns;
}

function generateCompatibilityTips(archetypeName) {
  const tips = {
    'Романтик': [
      'Ищи партнёра, который ценит глубину чувств',
      'Избегай слишком рациональных или холодных людей',
      'Важна эмоциональная отзывчивость партнёра'
    ],
    'Избегающий': [
      'Подходят независимые и самодостаточные партнёры',
      'Нужно время и пространство для личного развития',
      'Избегай слишком требовательных или навязчивых людей'
    ],
    'Стратег': [
      'Ищи партнёра с похожими жизненными целями',
      'Важна совместимость в планах на будущее',
      'Цени стабильность и надёжность в отношениях'
    ],
    'Искатель': [
      'Подходят открытые к экспериментам партнёры',
      'Важна возможность роста и развития вместе',
      'Не торопись с серьёзными обязательствами'
    ]
  };
  
  return tips[archetypeName] || [];
}

module.exports = router;