const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

let db;

// Инициализация базы данных
function initDatabase() {
  const dbPath = path.join(__dirname, 'relationship_ai.db');
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('📦 Connected to SQLite database');
      
      // Выполняем основную SQL схему
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      
      db.exec(schema, (err) => {
        if (err) {
          console.error('Error executing schema:', err);
        } else {
          console.log('✅ Main database schema initialized');
          
          // Загружаем схему психологического теста
          try {
            const psychSchema = fs.readFileSync(path.join(__dirname, 'psychological_test_schema.sql'), 'utf8');
            db.exec(psychSchema, (err) => {
              if (err) {
                console.error('Error executing psychological schema:', err);
              } else {
                console.log('✅ Psychological test schema initialized');
                
                // Загружаем фрагменты личности
                try {
                  const fragmentsSchema = fs.readFileSync(path.join(__dirname, 'personality_fragments.sql'), 'utf8');
                  db.exec(fragmentsSchema, (err) => {
                    if (err && !err.message.includes('UNIQUE constraint failed')) {
                      console.error('Error loading personality fragments:', err);
                    } else {
                      console.log('✅ Personality fragments loaded');
                    }
                  });
                  
                  // Загружаем систему подсчета очков
                  const scoringSchema = fs.readFileSync(path.join(__dirname, 'answer_scoring.sql'), 'utf8');
                  db.exec(scoringSchema, (err) => {
                    if (err && !err.message.includes('UNIQUE constraint failed')) {
                      console.error('Error loading answer scoring:', err);
                    } else {
                      console.log('✅ Answer scoring system loaded');
                    }
                  });
                  
                } catch (fragmentsError) {
                  console.error('Error reading fragments file:', fragmentsError);
                }
              }
            });
          } catch (psychError) {
            console.error('Error reading psychological schema file:', psychError);
          }
        }
      });
    }
  });
  
  // Включаем внешние ключи
  db.run('PRAGMA foreign_keys = ON');
  
  return db;
}

// Получение подключения к базе данных
function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Функции для работы с пользователями
const userQueries = {
  // Создание или обновление пользователя
  async createOrUpdateUser(telegramData, referrerId = null) {
    return new Promise((resolve, reject) => {
      const { id: telegram_id, username, first_name, last_name } = telegramData;
      
      const query = `
        INSERT INTO users (telegram_id, username, first_name, last_name, referrer_id) 
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(telegram_id) DO UPDATE SET
          username = excluded.username,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      db.get(query, [telegram_id, username, first_name, last_name, referrerId], (err, row) => {
        if (err) {
          // Если ON CONFLICT не поддерживается, используем альтернативный подход
          if (err.message.includes('CONFLICT')) {
            // Пробуем обновить существующего пользователя
            const updateQuery = `
              UPDATE users SET 
                username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
              WHERE telegram_id = ?
            `;
            db.run(updateQuery, [username, first_name, last_name, telegram_id], function(updateErr) {
              if (updateErr) {
                reject(updateErr);
              } else {
                // Получаем обновленного пользователя
                db.get('SELECT * FROM users WHERE telegram_id = ?', [telegram_id], (selectErr, user) => {
                  if (selectErr) reject(selectErr);
                  else resolve(user);
                });
              }
            });
          } else {
            reject(err);
          }
        } else {
          resolve(row);
        }
      });
    });
  },

  // Получение пользователя по Telegram ID
  async getUserByTelegramId(telegramId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Проверка, использовал ли пользователь бесплатный анализ
  async hasUsedFreeAnalysis(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT free_analysis_used FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.free_analysis_used > 0 : false);
      });
    });
  },

  // Отметка использования бесплатного анализа
  async markFreeAnalysisUsed(userId) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET free_analysis_used = 1 WHERE id = ?', [userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Функции для работы с вопросами
const questionQueries = {
  // Получение всех вопросов
  async getAllQuestions() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM questions ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else {
          // Парсим JSON опции
          const questions = rows.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : []
          }));
          resolve(questions);
        }
      });
    });
  }
};

// Функции для работы с ответами
const answerQueries = {
  // Сохранение ответа
  async saveAnswer(userId, questionId, answer, score = 0) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO answers (user_id, question_id, answer, score) 
        VALUES (?, ?, ?, ?)
      `;
      db.run(query, [userId, questionId, answer, score], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  // Получение ответов пользователя
  async getUserAnswers(userId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM answers WHERE user_id = ? ORDER BY question_id', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

// Функции для работы с результатами
const resultQueries = {
  // Сохранение результата анализа
  async saveResult(userId, archetype, description, recommendations, detailedAnalysis, totalScore) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO results (user_id, archetype, description, recommendations, detailed_analysis, total_score) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.run(query, [userId, archetype, description, recommendations, detailedAnalysis, totalScore], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  // Получение последнего результата пользователя
  async getLatestResult(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// Функции для работы с архетипами
const archetypeQueries = {
  // Получение архетипа по ID
  async getArchetypeById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM archetypes WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else {
          if (row) {
            // Парсим JSON поля
            row.strengths = row.strengths ? JSON.parse(row.strengths) : [];
            row.weaknesses = row.weaknesses ? JSON.parse(row.weaknesses) : [];
            row.recommendations = row.recommendations ? JSON.parse(row.recommendations) : [];
          }
          resolve(row);
        }
      });
    });
  },

  // Получение всех архетипов
  async getAllArchetypes() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM archetypes ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else {
          const archetypes = rows.map(row => ({
            ...row,
            strengths: row.strengths ? JSON.parse(row.strengths) : [],
            weaknesses: row.weaknesses ? JSON.parse(row.weaknesses) : [],
            recommendations: row.recommendations ? JSON.parse(row.recommendations) : []
          }));
          resolve(archetypes);
        }
      });
    });
  }
};

// Функции для работы с платежами
const paymentQueries = {
  // Создание записи о платеже
  async createPayment(userId, amount, method, productType, referrerId = null, referrerReward = 0) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO payments (user_id, amount, method, product_type, referrer_id, referrer_reward) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.run(query, [userId, amount, method, productType, referrerId, referrerReward], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  // Обновление статуса платежа
  async updatePaymentStatus(paymentId, status, transactionId = null) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE payments SET status = ?, transaction_id = ? WHERE id = ?`;
      db.run(query, [status, transactionId, paymentId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Функции для реферальной системы
const referralQueries = {
  // Создание реферальной связи
  async createReferral(referrerId, referredId) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR IGNORE INTO referrals (referrer_id, referred_id) 
        VALUES (?, ?)
      `;
      db.run(query, [referrerId, referredId], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  },

  // Получение реферальной статистики
  async getReferralStats(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_referrals,
          SUM(reward_paid) as total_rewards,
          SUM(first_purchase_made) as successful_referrals
        FROM referrals 
        WHERE referrer_id = ?
      `;
      db.get(query, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// Функции для работы с реферальными кодами
const referralCodeQueries = {
  // Генерация уникального кода
  generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Создание реферального кода для пользователя
  async createReferralCode(userId) {
    return new Promise(async (resolve, reject) => {
      try {
        // Проверяем, есть ли уже активный код
        const existingCode = await this.getUserReferralCode(userId);
        if (existingCode) {
          resolve(existingCode);
          return;
        }

        // Генерируем уникальный код
        let code;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
          code = this.generateUniqueCode();
          
          // Проверяем уникальность
          db.get('SELECT id FROM referral_codes WHERE code = ?', [code], (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            if (!row) {
              isUnique = true;
            }
          });
          attempts++;
        }

        if (!isUnique) {
          reject(new Error('Failed to generate unique code'));
          return;
        }

        // Создаем запись
        const query = `
          INSERT INTO referral_codes (user_id, code) 
          VALUES (?, ?)
        `;
        
        db.run(query, [userId, code], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              code: code,
              user_id: userId,
              clicks: 0,
              successful_referrals: 0
            });
          }
        });
        
      } catch (error) {
        reject(error);
      }
    });
  },

  // Получение реферального кода пользователя
  async getUserReferralCode(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM referral_codes WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Поиск пользователя по реферальному коду
  async getUserByReferralCode(code) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT rc.*, u.* FROM referral_codes rc JOIN users u ON rc.user_id = u.id WHERE rc.code = ? AND rc.is_active = 1',
        [code],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Увеличение счетчика кликов
  async incrementClicks(code) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE referral_codes SET clicks = clicks + 1 WHERE code = ?',
        [code],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  // Увеличение счетчика успешных рефералов
  async incrementSuccessfulReferrals(code) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE referral_codes SET successful_referrals = successful_referrals + 1 WHERE code = ?',
        [code],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
};

module.exports = {
  initDatabase,
  getDB,
  users: userQueries,
  questions: questionQueries,
  answers: answerQueries,
  results: resultQueries,
  archetypes: archetypeQueries,
  payments: paymentQueries,
  referrals: referralQueries,
  referralCodes: referralCodeQueries
};