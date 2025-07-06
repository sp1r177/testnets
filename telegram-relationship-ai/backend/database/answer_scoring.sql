-- Система подсчета очков для психологического теста

-- Таблица связей ответов с психологическими шкалами
CREATE TABLE IF NOT EXISTS answer_scale_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    answer_index INTEGER NOT NULL, -- 0-4 (индекс варианта ответа)
    scale_id INTEGER NOT NULL,
    weight INTEGER NOT NULL, -- влияние на шкалу (-20 до +20)
    FOREIGN KEY (question_id) REFERENCES questions (id),
    FOREIGN KEY (scale_id) REFERENCES psychological_scales (id)
);

-- Заполняем систему весов для каждого вопроса и ответа

-- Вопрос 1: "Когда тебе тяжело, как ты чаще всего ведёшь себя?"
-- 0: "Замыкаюсь в себе и никого не пускаю"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(1, 0, 1, 15), -- тревожность +15
(1, 0, 2, -10), -- самооценка -10
(1, 0, 8, -8); -- эмоциональная стабильность -8

-- 1: "Стараюсь всё решить сам, не жалуюсь"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(1, 1, 4, 12), -- уверенность +12
(1, 1, 7, 10), -- контроль +10
(1, 1, 3, -15); -- созависимость -15

-- 2: "Жду, пока само пройдёт"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(1, 2, 4, -12), -- уверенность -12
(1, 2, 6, 10), -- самосаботаж +10
(1, 2, 8, -5); -- эмоциональная стабильность -5

-- 3: "Обращаюсь за поддержкой, но редко получаю её"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(1, 3, 2, -8), -- самооценка -8
(1, 3, 5, 8), -- обидчивость +8
(1, 3, 1, 5); -- тревожность +5

-- 4: "Сразу бегу за советом к близким"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(1, 4, 3, 12), -- созависимость +12
(1, 4, 4, -8), -- уверенность -8
(1, 4, 7, -10); -- контроль -10

-- Вопрос 2: "Что ты чувствуешь, когда кто-то не отвечает тебе долгое время?"
-- 0: "Меня накрывает тревога, думаю о плохом"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(2, 0, 1, 18), -- тревожность +18
(2, 0, 8, -10), -- эмоциональная стабильность -10
(2, 0, 2, -5); -- самооценка -5

-- 1: "Злюсь, но молчу"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(2, 1, 5, 15), -- обидчивость +15
(2, 1, 8, -8), -- эмоциональная стабильность -8
(2, 1, 6, 5); -- самосаботаж +5

-- 2: "Отключаю эмоции, будто мне всё равно"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(2, 2, 8, 8), -- эмоциональная стабильность +8
(2, 2, 3, -10), -- созависимость -10
(2, 2, 6, 8); -- самосаботаж +8

-- 3: "Начинаю докапываться, пишу снова и снова"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(2, 3, 1, 12), -- тревожность +12
(2, 3, 7, 15), -- контроль +15
(2, 3, 3, 10); -- созависимость +10

-- 4: "Спокойно жду — у всех бывают дела"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(2, 4, 8, 15), -- эмоциональная стабильность +15
(2, 4, 1, -15), -- тревожность -15
(2, 4, 7, -12); -- контроль -12

-- Вопрос 3: "Что ты думаешь, когда видишь, как другим везёт в жизни?"
-- 0: "Меня это раздражает — чем я хуже?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(3, 0, 2, -15), -- самооценка -15
(3, 0, 5, 12), -- обидчивость +12
(3, 0, 8, -8); -- эмоциональная стабильность -8

-- 1: "Чувствую себя неудачником"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(3, 1, 2, -18), -- самооценка -18
(3, 1, 6, 10), -- самосаботаж +10
(3, 1, 1, 8); -- тревожность +8

-- 2: "Испытываю лёгкую зависть, но рад за них"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(3, 2, 8, 10), -- эмоциональная стабильность +10
(3, 2, 2, 5), -- самооценка +5
(3, 2, 5, -5); -- обидчивость -5

-- 3: "Сравниваю и начинаю загоняться"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(3, 3, 1, 12), -- тревожность +12
(3, 3, 2, -10), -- самооценка -10
(3, 3, 6, 8); -- самосаботаж +8

-- 4: "Это мотивирует меня делать больше"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(3, 4, 4, 15), -- уверенность +15
(3, 4, 2, 10), -- самооценка +10
(3, 4, 8, 8); -- эмоциональная стабильность +8

-- Вопрос 4: "Как ты реагируешь на критику?"
-- 0: "Разваливаюсь внутри, но делаю вид, что всё нормально"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(4, 0, 2, -15), -- самооценка -15
(4, 0, 6, 12), -- самосаботаж +12
(4, 0, 8, -10); -- эмоциональная стабильность -10

-- 1: "Сразу защищаюсь и оправдываюсь"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(4, 1, 2, -8), -- самооценка -8
(4, 1, 5, 10), -- обидчивость +10
(4, 1, 8, -5); -- эмоциональная стабильность -5

-- 2: "Принимаю близко к сердцу, долго переживаю"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(4, 2, 2, -12), -- самооценка -12
(4, 2, 1, 10), -- тревожность +10
(4, 2, 8, -8); -- эмоциональная стабильность -8

-- 3: "Анализирую и делаю выводы"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(4, 3, 8, 12), -- эмоциональная стабильность +12
(4, 3, 4, 10), -- уверенность +10
(4, 3, 2, 8); -- самооценка +8

-- 4: "Меня это почти не задевает"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(4, 4, 8, 15), -- эмоциональная стабильность +15
(4, 4, 2, 12), -- самооценка +12
(4, 4, 1, -10); -- тревожность -10

-- Вопрос 5: "Что происходит с тобой в конфликте?"
-- 0: "Теряюсь, соглашаюсь, лишь бы закончить"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(5, 0, 4, -15), -- уверенность -15
(5, 0, 3, 12), -- созависимость +12
(5, 0, 1, 10); -- тревожность +10

-- 1: "Иду в атаку, пока не выиграю"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(5, 1, 7, 15), -- контроль +15
(5, 1, 8, -10), -- эмоциональная стабильность -10
(5, 1, 5, 8); -- обидчивость +8

-- 2: "Ухожу в себя, замолкаю"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(5, 2, 6, 10), -- самосаботаж +10
(5, 2, 5, 12), -- обидчивость +12
(5, 2, 4, -8); -- уверенность -8

-- 3: "Пытаюсь найти компромисс любой ценой"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(5, 3, 3, 15), -- созависимость +15
(5, 3, 4, -5), -- уверенность -5
(5, 3, 1, 8); -- тревожность +8

-- 4: "Чётко отстаиваю свою позицию"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(5, 4, 4, 18), -- уверенность +18
(5, 4, 2, 10), -- самооценка +10
(5, 4, 8, 8); -- эмоциональная стабильность +8

-- Продолжаем для остальных вопросов...
-- Вопрос 6: "Как ты относишься к своим ошибкам?"
-- 0: "Мучаюсь виной, не могу себе простить"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(6, 0, 6, 18), -- самосаботаж +18
(6, 0, 2, -15), -- самооценка -15
(6, 0, 1, 12); -- тревожность +12

-- 1: "Всегда нахожу, кого ещё обвинить"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(6, 1, 2, -8), -- самооценка -8
(6, 1, 5, 15), -- обидчивость +15
(6, 1, 7, 10); -- контроль +10

-- 2: "Делаю вид, что ничего не произошло"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(6, 2, 6, 12), -- самосаботаж +12
(6, 2, 8, -5), -- эмоциональная стабильность -5
(6, 2, 4, -8); -- уверенность -8

-- 3: "Анализирую, что пошло не так"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(6, 3, 4, 12), -- уверенность +12
(6, 3, 8, 10), -- эмоциональная стабильность +10
(6, 3, 2, 8); -- самооценка +8

-- 4: "Принимаю как урок и иду дальше"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(6, 4, 8, 15), -- эмоциональная стабильность +15
(6, 4, 2, 12), -- самооценка +12
(6, 4, 4, 10); -- уверенность +10

-- Вопрос 7: "Что ты чувствуешь, когда остаёшься один надолго?"
-- 0: "Начинаю накручивать себя, думать о плохом"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(7, 0, 1, 18), -- тревожность +18
(7, 0, 8, -12), -- эмоциональная стабильность -12
(7, 0, 2, -8); -- самооценка -8

-- 1: "Наконец-то могу расслабиться"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(7, 1, 8, 15), -- эмоциональная стабильность +15
(7, 1, 3, -12), -- созависимость -12
(7, 1, 1, -10); -- тревожность -10

-- 2: "Чувствую пустоту и тоску"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(7, 2, 3, 15), -- созависимость +15
(7, 2, 2, -10), -- самооценка -10
(7, 2, 8, -8); -- эмоциональная стабильность -8

-- 3: "Занимаюсь своими делами с удовольствием"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(7, 3, 2, 12), -- самооценка +12
(7, 3, 8, 10), -- эмоциональная стабильность +10
(7, 3, 3, -10); -- созависимость -10

-- 4: "Скучаю, но спокойно переношу одиночество"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(7, 4, 8, 12), -- эмоциональная стабильность +12
(7, 4, 2, 8), -- самооценка +8
(7, 4, 3, 5); -- созависимость +5

-- Вопрос 8: "Как ты принимаешь важные решения?"
-- 0: "Мечусь, сомневаюсь, боюсь ошибиться"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(8, 0, 4, -18), -- уверенность -18
(8, 0, 1, 15), -- тревожность +15
(8, 0, 6, 10); -- самосаботаж +10

-- 1: "Решаю быстро, потом сожалею"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(8, 1, 8, -12), -- эмоциональная стабильность -12
(8, 1, 6, 8), -- самосаботаж +8
(8, 1, 4, -5); -- уверенность -5

-- 2: "Откладываю до последнего"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(8, 2, 6, 15), -- самосаботаж +15
(8, 2, 4, -12), -- уверенность -12
(8, 2, 1, 8); -- тревожность +8

-- 3: "Советуюсь со всеми подряд"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(8, 3, 3, 12), -- созависимость +12
(8, 3, 4, -10), -- уверенность -10
(8, 3, 1, 8); -- тревожность +8

-- 4: "Взвешиваю все «за» и «против»"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(8, 4, 4, 15), -- уверенность +15
(8, 4, 8, 12), -- эмоциональная стабильность +12
(8, 4, 7, 8); -- контроль +8

-- Продолжаем добавлять веса для остальных вопросов 9-15...
-- Я добавлю ключевые, остальные можно дополнить аналогично

-- Вопрос 9: "Что ты делаешь, когда чувствуешь, что тебя не понимают?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(9, 0, 5, 15), -- обидчивость +15
(9, 0, 6, 10), -- самосаботаж +10
(9, 1, 5, 18), -- обидчивость +18
(9, 1, 8, -10), -- эмоциональная стабильность -10
(9, 2, 6, 12), -- самосаботаж +12
(9, 2, 2, -8), -- самооценка -8
(9, 3, 3, 10), -- созависимость +10
(9, 3, 4, 8), -- уверенность +8
(9, 4, 8, 15), -- эмоциональная стабильность +15
(9, 4, 2, 10); -- самооценка +10

-- Вопрос 10: "Как ты ведёшь себя, когда влюбляешься?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(10, 0, 3, 20), -- созависимость +20
(10, 0, 6, 12), -- самосаботаж +12
(10, 1, 7, 15), -- контроль +15
(10, 1, 5, 12), -- обидчивость +12
(10, 2, 6, 15), -- самосаботаж +15
(10, 2, 2, -10), -- самооценка -10
(10, 3, 2, -8), -- самооценка -8
(10, 3, 1, 10), -- тревожность +10
(10, 4, 2, 15), -- самооценка +15
(10, 4, 8, 12); -- эмоциональная стабильность +12

-- Вопрос 11: "Что ты чувствуешь перед важным событием?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(11, 0, 1, 20), -- тревожность +20
(11, 0, 8, -15), -- эмоциональная стабильность -15
(11, 1, 5, 12), -- обидчивость +12
(11, 1, 6, 8), -- самосаботаж +8
(11, 2, 8, -10), -- эмоциональная стабильность -10
(11, 2, 6, 12), -- самосаботаж +12
(11, 3, 1, 8), -- тревожность +8
(11, 3, 4, 8), -- уверенность +8
(11, 4, 8, 15), -- эмоциональная стабильность +15
(11, 4, 4, 12); -- уверенность +12

-- Вопрос 12: "Как ты реагируешь на несправедливость?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(12, 0, 5, 18), -- обидчивость +18
(12, 0, 6, 10), -- самосаботаж +10
(12, 1, 4, 15), -- уверенность +15
(12, 1, 5, 8), -- обидчивость +8
(12, 2, 6, 15), -- самосаботаж +15
(12, 2, 2, -10), -- самооценка -10
(12, 3, 4, 12), -- уверенность +12
(12, 3, 8, 10), -- эмоциональная стабильность +10
(12, 4, 8, 15), -- эмоциональная стабильность +15
(12, 4, 1, -8); -- тревожность -8

-- Вопрос 13: "Что происходит, когда твои планы рушатся?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(13, 0, 1, 18), -- тревожность +18
(13, 0, 4, -15), -- уверенность -15
(13, 1, 5, 15), -- обидчивость +15
(13, 1, 8, -10), -- эмоциональная стабильность -10
(13, 2, 6, 15), -- самосаботаж +15
(13, 2, 8, -12), -- эмоциональная стабильность -12
(13, 3, 4, 8), -- уверенность +8
(13, 3, 8, 10), -- эмоциональная стабильность +10
(13, 4, 8, 18), -- эмоциональная стабильность +18
(13, 4, 4, 12); -- уверенность +12

-- Вопрос 14: "Как ты относишься к комплиментам?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(14, 0, 2, -15), -- самооценка -15
(14, 0, 1, 10), -- тревожность +10
(14, 1, 2, -10), -- самооценка -10
(14, 1, 1, 8), -- тревожность +8
(14, 2, 6, 12), -- самосаботаж +12
(14, 2, 2, -8), -- самооценка -8
(14, 3, 2, 8), -- самооценка +8
(14, 3, 8, 5), -- эмоциональная стабильность +5
(14, 4, 2, 18), -- самооценка +18
(14, 4, 8, 12); -- эмоциональная стабильность +12

-- Вопрос 15: "Что ты чувствуешь, когда видишь чужое горе?"
INSERT OR IGNORE INTO answer_scale_weights (question_id, answer_index, scale_id, weight) VALUES 
(15, 0, 3, 20), -- созависимость +20
(15, 0, 6, 10), -- самосаботаж +10
(15, 1, 6, 15), -- самосаботаж +15
(15, 1, 1, 12), -- тревожность +12
(15, 2, 3, 15), -- созависимость +15
(15, 2, 1, 10), -- тревожность +10
(15, 3, 8, 12), -- эмоциональная стабильность +12
(15, 3, 2, 8), -- самооценка +8
(15, 4, 4, 15), -- уверенность +15
(15, 4, 8, 10); -- эмоциональная стабильность +10

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_answer_scale_weights_question_id ON answer_scale_weights(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_scale_weights_scale_id ON answer_scale_weights(scale_id);