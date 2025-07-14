const express = require('express');
const db = require('../database/db');

const router = express.Router();

// Психологический анализатор
class PsychologicalAnalyzer {
  
  // Подсчет баллов по шкалам на основе ответов
  async calculateScaleScores(userAnswers) {
    const scaleScores = {};
    const db_instance = db.getDB();
    
    // Инициализируем все шкалы базовым значением 50
    const scales = await this.getScales();
    scales.forEach(scale => {
      scaleScores[scale.id] = 50; // базовое значение
    });
    
    // Проходим по всем ответам пользователя
    for (const answer of userAnswers) {
      const weights = await new Promise((resolve, reject) => {
        db_instance.all(
          'SELECT scale_id, weight FROM answer_scale_weights WHERE question_id = ? AND answer_index = ?',
          [answer.question_id, answer.answer_index],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      // Применяем веса к соответствующим шкалам
      weights.forEach(weight => {
        if (scaleScores[weight.scale_id] !== undefined) {
          scaleScores[weight.scale_id] += weight.weight;
          // Ограничиваем значения диапазоном 0-100
          scaleScores[weight.scale_id] = Math.max(0, Math.min(100, scaleScores[weight.scale_id]));
        }
      });
    }
    
    return scaleScores;
  }
  
  // Получение всех психологических шкал
  async getScales() {
    const db_instance = db.getDB();
    return new Promise((resolve, reject) => {
      db_instance.all('SELECT * FROM psychological_scales', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  // Определение уровня по шкале (low, medium, high)
  getScaleLevel(score) {
    if (score <= 35) return 'low';
    if (score >= 65) return 'high';
    return 'medium';
  }
  
  // Получение фрагментов для генерации описания
  async getPersonalityFragments(scaleScores) {
    const db_instance = db.getDB();
    const selectedFragments = [];
    
    // Сортируем шкалы по убыванию экстремальности (чем дальше от 50, тем интереснее)
    const sortedScales = Object.entries(scaleScores)
      .map(([scaleId, score]) => ({
        scaleId: parseInt(scaleId),
        score,
        extremity: Math.abs(score - 50)
      }))
      .sort((a, b) => b.extremity - a.extremity);
    
    // Выбираем топ-6 самых выраженных шкал
    const topScales = sortedScales.slice(0, 6);
    
    for (const scale of topScales) {
      const level = this.getScaleLevel(scale.score);
      
      const fragments = await new Promise((resolve, reject) => {
        db_instance.all(
          `SELECT * FROM personality_fragments 
           WHERE scale_id = ? AND weight_range = ? 
           ORDER BY emotional_impact DESC, order_priority ASC`,
          [scale.scaleId, level],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      // Добавляем 1-2 самых эмоциональных фрагмента для каждой шкалы
      selectedFragments.push(...fragments.slice(0, 2));
    }
    
    // Добавляем универсальные фрагменты
    const universalFragments = await new Promise((resolve, reject) => {
      db_instance.all(
        `SELECT * FROM personality_fragments 
         WHERE weight_range = 'universal' 
         ORDER BY order_priority ASC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    selectedFragments.push(...universalFragments);
    
    return selectedFragments;
  }
  
  // Генерация заголовка на основе доминирующих черт
  generateTitle(scaleScores) {
    const dominantTraits = [];
    
    // Анализируем высокие значения шкал
    if (scaleScores[1] >= 65) dominantTraits.push("Тревожный");
    if (scaleScores[2] <= 35) dominantTraits.push("Неуверенный");
    if (scaleScores[2] >= 65) dominantTraits.push("Уверенный");
    if (scaleScores[3] >= 65) dominantTraits.push("Созависимый");
    if (scaleScores[4] >= 65) dominantTraits.push("Решительный");
    if (scaleScores[5] >= 65) dominantTraits.push("Обидчивый");
    if (scaleScores[6] >= 65) dominantTraits.push("Самосаботажник");
    if (scaleScores[7] >= 65) dominantTraits.push("Контролирующий");
    if (scaleScores[8] <= 35) dominantTraits.push("Эмоционально нестабильный");
    if (scaleScores[8] >= 65) dominantTraits.push("Эмоционально стабильный");
    
    if (dominantTraits.length === 0) {
      return "Твой сложный внутренний мир";
    }
    
    if (dominantTraits.length === 1) {
      return `Ты ${dominantTraits[0].toLowerCase()}`;
    }
    
    return `Ты ${dominantTraits.slice(0, 2).join(" и ").toLowerCase()}`;
  }
  
  // Генерация полного психологического портрета
  async generatePsychologicalPortrait(userAnswers) {
    // Подсчитываем баллы по шкалам
    const scaleScores = await this.calculateScaleScores(userAnswers);
    
    // Получаем подходящие фрагменты
    const fragments = await this.getPersonalityFragments(scaleScores);
    
    // Генерируем заголовок
    const title = this.generateTitle(scaleScores);
    
    // Сортируем фрагменты по эмоциональному воздействию и важности
    const sortedFragments = fragments.sort((a, b) => {
      return (b.emotional_impact * 10 + (5 - b.order_priority)) - 
             (a.emotional_impact * 10 + (5 - a.order_priority));
    });
    
    // Формируем превью (первые 3 самых цепляющих фрагмента)
    const previewFragments = sortedFragments.slice(0, 3);
    const preview = previewFragments.map(f => `**${f.title}**\n\n${f.content}`).join('\n\n---\n\n');
    
    // Формируем полный текст
    const fullFragments = sortedFragments.slice(0, 10); // берем топ-10 фрагментов
    const fullText = fullFragments.map(f => `**${f.title}**\n\n${f.content}`).join('\n\n---\n\n');
    
    // Собираем эмоциональные крючки для мотивации к покупке
    const emotionalHooks = previewFragments
      .filter(f => f.emotional_impact >= 4)
      .map(f => f.title);
    
    return {
      title,
      preview_text: preview,
      full_text: fullText,
      emotional_hooks: emotionalHooks,
      scale_scores: scaleScores,
      generated_fragments: sortedFragments.map(f => f.id)
    };
  }
}

const analyzer = new PsychologicalAnalyzer();

// Сохранение ответов пользователя
router.post('/submit-answers', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    
    if (!userId || !answers || !Array.isArray(answers) || answers.length !== 15) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем, не проходил ли пользователь уже тест
    const existingResult = await new Promise((resolve, reject) => {
      const db_instance = db.getDB();
      db_instance.get(
        'SELECT id FROM psychological_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (existingResult) {
      return res.status(400).json({ 
        error: 'Test already completed',
        result_id: existingResult.id
      });
    }
    
    const db_instance = db.getDB();
    
    // Сохраняем ответы
    for (let i = 0; i < answers.length; i++) {
      await new Promise((resolve, reject) => {
        db_instance.run(
          'INSERT OR REPLACE INTO answers (user_id, question_id, answer, score) VALUES (?, ?, ?, ?)',
          [user.id, i + 1, answers[i], i], // answer - это индекс выбранного варианта
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // Формируем данные для анализа
    const userAnswers = answers.map((answerIndex, index) => ({
      question_id: index + 1,
      answer_index: answerIndex
    }));
    
    // Генерируем психологический портрет
    const portrait = await analyzer.generatePsychologicalPortrait(userAnswers);
    
    // Сохраняем результат в базу
    const resultId = await new Promise((resolve, reject) => {
      db_instance.run(
        `INSERT INTO psychological_results 
         (user_id, title, preview_text, full_text, emotional_hooks, generated_fragments) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          portrait.title,
          portrait.preview_text,
          portrait.full_text,
          JSON.stringify(portrait.emotional_hooks),
          JSON.stringify(portrait.generated_fragments)
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // Сохраняем баллы по шкалам
    for (const [scaleId, score] of Object.entries(portrait.scale_scores)) {
      await new Promise((resolve, reject) => {
        db_instance.run(
          'INSERT OR REPLACE INTO user_scale_scores (user_id, scale_id, score) VALUES (?, ?, ?)',
          [user.id, parseInt(scaleId), score],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    res.json({
      success: true,
      result_id: resultId,
      title: portrait.title,
      preview: portrait.preview_text,
      emotional_hooks: portrait.emotional_hooks,
      requires_payment: true
    });
    
  } catch (error) {
    console.error('Submit answers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение результата теста
router.get('/result/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const db_instance = db.getDB();
    
    const result = await new Promise((resolve, reject) => {
      db_instance.get(
        'SELECT * FROM psychological_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!result) {
      return res.status(404).json({ error: 'No test results found' });
    }
    
    res.json({
      success: true,
      result: {
        id: result.id,
        title: result.title,
        preview: result.preview_text,
        full_text: result.is_premium_unlocked ? result.full_text : null,
        is_premium_unlocked: result.is_premium_unlocked,
        emotional_hooks: JSON.parse(result.emotional_hooks || '[]'),
        created_at: result.created_at
      }
    });
    
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Разблокировка полного результата после оплаты
router.post('/unlock-result', async (req, res) => {
  try {
    const { userId, paymentId } = req.body;
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const db_instance = db.getDB();
    
    // Проверяем, что платеж существует и завершен
    const payment = await new Promise((resolve, reject) => {
      db_instance.get(
        'SELECT * FROM payments WHERE id = ? AND user_id = ? AND status = "completed"',
        [paymentId, user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or not completed' });
    }
    
    // Разблокируем результат
    await new Promise((resolve, reject) => {
      db_instance.run(
        'UPDATE psychological_results SET is_premium_unlocked = 1, unlock_payment_id = ? WHERE user_id = ?',
        [paymentId, user.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Возвращаем полный результат
    const result = await new Promise((resolve, reject) => {
      db_instance.get(
        'SELECT * FROM psychological_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    res.json({
      success: true,
      full_text: result.full_text
    });
    
  } catch (error) {
    console.error('Unlock result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Получение статистики пользователя по шкалам
router.get('/scales/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.users.getUserByTelegramId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const db_instance = db.getDB();
    
    const scaleScores = await new Promise((resolve, reject) => {
      db_instance.all(
        `SELECT uss.*, ps.name, ps.description 
         FROM user_scale_scores uss 
         JOIN psychological_scales ps ON uss.scale_id = ps.id 
         WHERE uss.user_id = ?`,
        [user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    res.json({
      success: true,
      scales: scaleScores
    });
    
  } catch (error) {
    console.error('Get scales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;