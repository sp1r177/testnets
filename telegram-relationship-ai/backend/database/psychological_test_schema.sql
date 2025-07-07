-- Новая структура для психологического теста

-- Таблица психологических шкал
CREATE TABLE IF NOT EXISTS psychological_scales (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    min_value INTEGER DEFAULT 0,
    max_value INTEGER DEFAULT 100
);

-- Таблица фрагментов описаний
CREATE TABLE IF NOT EXISTS personality_fragments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scale_id INTEGER,
    weight_range TEXT, -- 'low', 'medium', 'high'
    fragment_type TEXT, -- 'strength', 'weakness', 'behavior', 'advice'
    title TEXT,
    content TEXT,
    emotional_impact INTEGER DEFAULT 1, -- 1-5, насколько эмоционально цепляет
    order_priority INTEGER DEFAULT 1,
    FOREIGN KEY (scale_id) REFERENCES psychological_scales (id)
);

-- Таблица результатов пользователей по шкалам
CREATE TABLE IF NOT EXISTS user_scale_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scale_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (scale_id) REFERENCES psychological_scales (id),
    UNIQUE(user_id, scale_id)
);

-- Обновленная таблица результатов с превью и полной версией
CREATE TABLE IF NOT EXISTS psychological_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    preview_text TEXT NOT NULL, -- Первые 2-3 абзаца (бесплатно)
    full_text TEXT NOT NULL, -- Полный текст (платно)
    emotional_hooks TEXT, -- JSON с самыми цепляющими фразами
    generated_fragments TEXT, -- JSON с ID использованных фрагментов
    is_premium_unlocked INTEGER DEFAULT 0,
    unlock_payment_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (unlock_payment_id) REFERENCES payments (id)
);

-- Вставляем психологические шкалы
INSERT OR IGNORE INTO psychological_scales (id, name, description, min_value, max_value) VALUES 
(1, 'anxiety', 'Уровень тревожности и склонности к беспокойству', 0, 100),
(2, 'self_worth', 'Самооценка и уверенность в себе', 0, 100),
(3, 'codependency', 'Склонность к созависимым отношениям', 0, 100),
(4, 'confidence', 'Уверенность в принятии решений', 0, 100),
(5, 'resentment', 'Склонность к обидам и злопамятность', 0, 100),
(6, 'self_sabotage', 'Тенденция к самосаботажу', 0, 100),
(7, 'control_trust', 'Потребность в контроле vs доверие', 0, 100),
(8, 'emotional_stability', 'Эмоциональная стабильность', 0, 100);

-- Новые 15 эмоциональных вопросов
DELETE FROM questions;
INSERT OR IGNORE INTO questions (id, text, options, type) VALUES 
(1, 'Когда тебе тяжело, как ты чаще всего ведёшь себя?', 
    '["Замыкаюсь в себе и никого не пускаю", "Стараюсь всё решить сам, не жалуюсь", "Жду, пока само пройдёт", "Обращаюсь за поддержкой, но редко получаю её", "Сразу бегу за советом к близким"]', 
    'multiple_choice'),

(2, 'Что ты чувствуешь, когда кто-то не отвечает тебе долгое время?', 
    '["Меня накрывает тревога, думаю о плохом", "Злюсь, но молчу", "Отключаю эмоции, будто мне всё равно", "Начинаю докапываться, пишу снова и снова", "Спокойно жду — у всех бывают дела"]', 
    'multiple_choice'),

(3, 'Что ты думаешь, когда видишь, как другим везёт в жизни?', 
    '["Меня это раздражает — чем я хуже?", "Чувствую себя неудачником", "Испытываю лёгкую зависть, но рад за них", "Сравниваю и начинаю загоняться", "Это мотивирует меня делать больше"]', 
    'multiple_choice'),

(4, 'Как ты реагируешь на критику?', 
    '["Разваливаюсь внутри, но делаю вид, что всё нормально", "Сразу защищаюсь и оправдываюсь", "Принимаю близко к сердцу, долго переживаю", "Анализирую и делаю выводы", "Меня это почти не задевает"]', 
    'multiple_choice'),

(5, 'Что происходит с тобой в конфликте?', 
    '["Теряюсь, соглашаюсь, лишь бы закончить", "Иду в атаку, пока не выиграю", "Ухожу в себя, замолкаю", "Пытаюсь найти компромисс любой ценой", "Чётко отстаиваю свою позицию"]', 
    'multiple_choice'),

(6, 'Как ты относишься к своим ошибкам?', 
    '["Мучаюсь виной, не могу себе простить", "Всегда нахожу, кого ещё обвинить", "Делаю вид, что ничего не произошло", "Анализирую, что пошло не так", "Принимаю как урок и иду дальше"]', 
    'multiple_choice'),

(7, 'Что ты чувствуешь, когда остаёшься один надолго?', 
    '["Начинаю накручивать себя, думать о плохом", "Наконец-то могу расслабиться", "Чувствую пустоту и тоску", "Занимаюсь своими делами с удовольствием", "Скучаю, но спокойно переношу одиночество"]', 
    'multiple_choice'),

(8, 'Как ты принимаешь важные решения?', 
    '["Мечусь, сомневаюсь, боюсь ошибиться", "Решаю быстро, потом сожалею", "Откладываю до последнего", "Советуюсь со всеми подряд", "Взвешиваю все «за» и «против»"]', 
    'multiple_choice'),

(9, 'Что ты делаешь, когда чувствуешь, что тебя не понимают?', 
    '["Замыкаюсь ещё больше", "Начинаю агрессивно доказывать свою правоту", "Притворяюсь, что мне всё равно", "Пытаюсь объяснить ещё раз, но терпеливо", "Принимаю, что люди разные"]', 
    'multiple_choice'),

(10, 'Как ты ведёшь себя, когда влюбляешься?', 
    '["Растворяюсь в человеке полностью", "Становлюсь собственником, ревную", "Делаю вид, что мне не очень интересно", "Стараюсь произвести впечатление", "Остаюсь собой, но открываюсь"]', 
    'multiple_choice'),

(11, 'Что ты чувствуешь перед важным событием?', 
    '["Тревожность съедает меня изнутри", "Злюсь на себя за волнение", "Становлюсь апатичным", "Волнуюсь, но готовлюсь", "Предвкушаю и радуюсь"]', 
    'multiple_choice'),

(12, 'Как ты реагируешь на несправедливость?', 
    '["Кипящая злость, но молчу", "Сразу иду в бой, отстаиваю правду", "Расстраиваюсь, но ничего не делаю", "Ищу способы решить ситуацию", "Принимаю как данность"]', 
    'multiple_choice'),

(13, 'Что происходит, когда твои планы рушатся?', 
    '["Паникую, не знаю, что делать", "Злюсь на всех вокруг", "Впадаю в апатию", "Расстраиваюсь, но ищу план Б", "Легко перестраиваюсь"]', 
    'multiple_choice'),

(14, 'Как ты относишься к комплиментам?', 
    '["Думаю, что люди врут или хотят что-то получить", "Смущаюсь, не знаю, что ответить", "Не замечаю или игнорирую", "Радуюсь, но не показываю", "Искренне благодарю и принимаю"]', 
    'multiple_choice'),

(15, 'Что ты чувствуешь, когда видишь чужое горе?', 
    '["Сразу беру всё на себя, хочу спасти", "Не знаю, как реагировать, избегаю", "Чувствую чужую боль как свою", "Сочувствую, но держу границы", "Предлагаю конкретную помощь"]', 
    'multiple_choice');

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_user_scale_scores_user_id ON user_scale_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scale_scores_scale_id ON user_scale_scores(scale_id);
CREATE INDEX IF NOT EXISTS idx_personality_fragments_scale_id ON personality_fragments(scale_id);
CREATE INDEX IF NOT EXISTS idx_psychological_results_user_id ON psychological_results(user_id);