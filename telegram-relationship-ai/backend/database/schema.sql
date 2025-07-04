-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    referrer_id INTEGER,
    subscription_type TEXT DEFAULT 'free',
    stars_balance INTEGER DEFAULT 0,
    free_analysis_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users (id)
);

-- Таблица вопросов
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    options TEXT, -- JSON массив с вариантами ответов
    type TEXT DEFAULT 'multiple_choice' -- multiple_choice, text, scale
);

-- Таблица ответов пользователей
CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (question_id) REFERENCES questions (id),
    UNIQUE(user_id, question_id)
);

-- Таблица результатов анализа
CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    archetype TEXT NOT NULL,
    description TEXT,
    recommendations TEXT,
    detailed_analysis TEXT,
    total_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL, -- в копейках
    method TEXT NOT NULL, -- 'stars', 'cryptobot'
    product_type TEXT NOT NULL, -- 'week_plan', 'month_plan', 'full_mentoring'
    referrer_id INTEGER,
    referrer_reward INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (referrer_id) REFERENCES users (id)
);

-- Таблица реферальной системы
CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL,
    referred_id INTEGER NOT NULL,
    reward_paid INTEGER DEFAULT 0,
    first_purchase_made INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users (id),
    FOREIGN KEY (referred_id) REFERENCES users (id),
    UNIQUE(referrer_id, referred_id)
);

-- Таблица архетипов
CREATE TABLE IF NOT EXISTS archetypes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    short_description TEXT,
    full_description TEXT,
    strengths TEXT, -- JSON
    weaknesses TEXT, -- JSON
    recommendations TEXT, -- JSON
    compatibility TEXT -- JSON с совместимостью
);

-- Вставляем базовые вопросы
INSERT OR IGNORE INTO questions (id, text, options, type) VALUES 
(1, 'Что для тебя важнее: любовь или финансовая стабильность?', 
    '["Любовь превыше всего", "Финансовая стабильность важнее", "Нужен баланс между ними", "Сначала стабильность, потом любовь"]', 
    'multiple_choice'),
    
(2, 'Ты чаще сближаешься или отдаляешься?', 
    '["Всегда стремлюсь к близости", "Часто отдаляюсь", "Зависит от настроения", "Сначала сближаюсь, потом отдаляюсь"]', 
    'multiple_choice'),
    
(3, 'Ты бы продолжал отношения без страсти?', 
    '["Никогда", "Да, если есть любовь", "Только ради детей/семьи", "Страсть не главное"]', 
    'multiple_choice'),
    
(4, 'Ты веришь в настоящую любовь?', 
    '["Абсолютно верю", "Скорее да, чем нет", "Скорее нет, чем да", "Это выдумка"]', 
    'multiple_choice'),
    
(5, 'Ты хочешь партнёра сильнее себя?', 
    '["Да, хочу опору", "Нет, предпочитаю равенство", "Хочу быть сильнее", "Не важно"]', 
    'multiple_choice'),
    
(6, 'Ты готов меняться ради другого человека?', 
    '["Готов кардинально измениться", "Готов на компромиссы", "Минимальные изменения", "Не буду меняться"]', 
    'multiple_choice'),
    
(7, 'Ты боишься быть отвергнутым?', 
    '["Очень боюсь", "Немного волнует", "Редко думаю об этом", "Совсем не боюсь"]', 
    'multiple_choice');

-- Вставляем базовые архетипы
INSERT OR IGNORE INTO archetypes (id, name, short_description, full_description, strengths, weaknesses, recommendations) VALUES 
(1, 'Романтик', 'Ты живёшь любовью и верой в идеальные отношения', 
    'Ты из тех, кто верит в большую любовь и готов отдавать себя целиком. Для тебя отношения — это не просто партнёрство, а магия, которая наполняет жизнь смыслом.',
    '["Глубокие чувства", "Преданность", "Способность к самопожертвованию", "Вера в лучшее"]',
    '["Идеализация партнёра", "Зависимость от отношений", "Игнорирование красных флагов", "Разочарование в реальности"]',
    '["Учись видеть партнёра реально", "Развивай независимость", "Работай над самооценкой", "Не теряй себя в отношениях"]'),
    
(2, 'Избегающий', 'Ты ценишь свободу и боишься потерять независимость',
    'Твоя защитная стратегия — держать дистанцию. Ты можешь любить, но всегда готов отступить, если отношения становятся слишком серьёзными.',
    '["Независимость", "Рациональность", "Самостоятельность", "Избегание токсичности"]',
    '["Страх близости", "Эмоциональная недоступность", "Трудности с обязательствами", "Одиночество"]',
    '["Работай над доверием", "Учись выражать чувства", "Не бойся уязвимости", "Ищи баланс между свободой и близостью"]'),
    
(3, 'Стратег', 'Ты подходишь к отношениям рационально и планируешь будущее',
    'Для тебя отношения — это осознанный выбор. Ты анализируешь совместимость, строишь планы и стремишься к стабильности.',
    '["Планирование", "Стабильность", "Практичность", "Надёжность"]',
    '["Недостаток спонтанности", "Чрезмерная рациональность", "Игнорирование эмоций", "Контроль"]',
    '["Добавь больше эмоций", "Будь спонтанным", "Слушай сердце", "Не всё нужно планировать"]'),
    
(4, 'Искатель', 'Ты всё ещё ищешь себя и своё место в любви',
    'Ты открыт новому опыту, но пока не знаешь точно, чего хочешь. Твои отношения — это путь самопознания.',
    '["Открытость", "Гибкость", "Рост", "Любознательность"]',
    '["Неопределённость", "Непостоянство", "Страх выбора", "Поиск идеала"]',
    '["Изучай себя", "Не торопись с выбором", "Пробуй разные типы отношений", "Работай над самопониманием"]');

-- Таблица уникальных реферальных кодов
CREATE TABLE IF NOT EXISTS referral_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code TEXT UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);