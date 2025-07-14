// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Конфигурация
const API_BASE = '/api';

// Состояние приложения
let currentUser = null;
let questions = [];
let answers = [];
let currentQuestionIndex = 0;
let testResult = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Получаем параметры запуска
        const urlParams = new URLSearchParams(window.location.search);
        const referrerId = urlParams.get('ref');
        const referralCode = urlParams.get('refCode');
        
        // Авторизация пользователя
        await authenticateUser(referrerId, referralCode);
        
        // Проверяем, есть ли уже результат теста
        await checkExistingResult();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Ошибка загрузки приложения');
    }
});

// Авторизация пользователя
async function authenticateUser(referrerId = null, referralCode = null) {
    try {
        const initData = tg.initData || 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22testuser%22%7D';
        
        // Если есть реферальный код, получаем информацию о нём
        let actualReferrerId = referrerId;
        if (referralCode) {
            try {
                const codeResponse = await fetch(`${API_BASE}/referral/code/${referralCode}`);
                if (codeResponse.ok) {
                    const codeData = await codeResponse.json();
                    actualReferrerId = codeData.referrer.id;
                }
            } catch (error) {
                console.error('Error getting referral code info:', error);
            }
        }
        
        const response = await fetch(`${API_BASE}/auth/telegram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
                referrerId: actualReferrerId,
                referralCode: referralCode
            })
        });
        
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        currentUser = data.user;
        
        console.log('User authenticated:', currentUser);
        
    } catch (error) {
        console.error('Auth error:', error);
        throw error;
    }
}

// Проверка существующего результата
async function checkExistingResult() {
    try {
        const response = await fetch(`${API_BASE}/psychtest/result/${currentUser.telegram_id}`);
        
        if (response.ok) {
            const data = await response.json();
            testResult = data.result;
            showResult(testResult);
        } else {
            // Результата нет, показываем intro
            showIntro();
        }
        
    } catch (error) {
        // Если ошибка 404, просто показываем intro
        showIntro();
    }
}

// Показать intro экран
function showIntro() {
    document.getElementById('intro-screen').classList.remove('hidden');
    document.getElementById('test-container').classList.add('hidden');
    document.getElementById('loading').classList.remove('active');
    document.getElementById('result-container').classList.add('hidden');
}

// Загрузка вопросов
async function loadQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions`);
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }
        
        const data = await response.json();
        questions = data.questions;
        
    } catch (error) {
        console.error('Error loading questions:', error);
        throw error;
    }
}

// Начать тест
async function startTest() {
    try {
        showLoading();
        
        await loadQuestions();
        
        if (questions.length < 15) {
            throw new Error('Insufficient questions loaded');
        }
        
        currentQuestionIndex = 0;
        answers = [];
        
        showTest();
        renderCurrentQuestion();
        
    } catch (error) {
        console.error('Error starting test:', error);
        showError('Ошибка загрузки теста');
    }
}

// Показать тест
function showTest() {
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('test-container').classList.remove('hidden');
    document.getElementById('loading').classList.remove('active');
    document.getElementById('result-container').classList.add('hidden');
}

// Показать загрузку
function showLoading() {
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('test-container').classList.add('hidden');
    document.getElementById('loading').classList.add('active');
    document.getElementById('result-container').classList.add('hidden');
}

// Отрендерить текущий вопрос
function renderCurrentQuestion() {
    const container = document.getElementById('test-container');
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    container.innerHTML = `
        <div class="question-card active">
            <div class="progress-container">
                <div class="progress-info">
                    <span class="progress-text">Вопрос ${currentQuestionIndex + 1} из ${questions.length}</span>
                    <span class="progress-text">${Math.round(progress)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <div class="question-number">Вопрос ${currentQuestionIndex + 1}</div>
            <div class="question-text">${question.text}</div>
            
            <div class="options">
                ${question.options.map((option, index) => `
                    <div class="option" onclick="selectOption(${index})" data-index="${index}">
                        ${option}
                    </div>
                `).join('')}
            </div>
            
            <div class="navigation">
                ${currentQuestionIndex > 0 ? 
                    '<button class="btn btn-secondary" onclick="previousQuestion()">← Назад</button>' : 
                    '<div></div>'
                }
                <button class="btn btn-primary" id="next-btn" onclick="nextQuestion()" disabled>
                    ${currentQuestionIndex === questions.length - 1 ? 'Завершить тест' : 'Далее →'}
                </button>
            </div>
        </div>
    `;
}

// Выбрать вариант ответа
function selectOption(index) {
    // Убираем выделение с других опций
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Выделяем выбранную опцию
    const selectedOption = document.querySelector(`.option[data-index="${index}"]`);
    selectedOption.classList.add('selected');
    
    // Сохраняем ответ
    answers[currentQuestionIndex] = index;
    
    // Активируем кнопку "Далее"
    document.getElementById('next-btn').disabled = false;
    
    // Добавляем haptic feedback для Telegram
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Следующий вопрос
function nextQuestion() {
    if (answers[currentQuestionIndex] === undefined) {
        return;
    }
    
    if (currentQuestionIndex === questions.length - 1) {
        // Это последний вопрос - завершаем тест
        submitTest();
    } else {
        currentQuestionIndex++;
        renderCurrentQuestion();
    }
}

// Предыдущий вопрос
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderCurrentQuestion();
        
        // Восстанавливаем выбранный ответ
        if (answers[currentQuestionIndex] !== undefined) {
            const selectedOption = document.querySelector(`.option[data-index="${answers[currentQuestionIndex]}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
                document.getElementById('next-btn').disabled = false;
            }
        }
    }
}

// Отправить тест
async function submitTest() {
    try {
        showLoading();
        
        if (answers.length !== questions.length) {
            throw new Error('Not all questions answered');
        }
        
        const response = await fetch(`${API_BASE}/psychtest/submit-answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentUser.telegram_id,
                answers: answers
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit test');
        }
        
        const data = await response.json();
        
        // Создаем объект результата
        testResult = {
            id: data.result_id,
            title: data.title,
            preview: data.preview,
            is_premium_unlocked: false,
            emotional_hooks: data.emotional_hooks
        };
        
        showResult(testResult);
        
    } catch (error) {
        console.error('Error submitting test:', error);
        showError('Ошибка обработки результатов');
    }
}

// Показать результат
function showResult(result) {
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('test-container').classList.add('hidden');
    document.getElementById('loading').classList.remove('active');
    document.getElementById('result-container').classList.remove('hidden');
    
    const container = document.getElementById('result-container');
    
    // Преобразуем markdown в HTML (простая реализация)
    const previewHtml = result.preview.replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>');
    
    container.innerHTML = `
        <div class="result-card active">
            <h1 class="result-title">${result.title}</h1>
            <div class="result-preview">${previewHtml}</div>
            
            ${!result.is_premium_unlocked ? `
                <div class="paywall">
                    <h3>🔓 Разблокируй полный анализ</h3>
                    <p>Узнай все детали своего психологического портрета</p>
                    <div class="price-old">299₽</div>
                    <div class="price">149₽</div>
                    <button class="btn btn-primary" onclick="purchaseFullResult()">
                        Получить полный анализ
                    </button>
                </div>
            ` : `
                <div class="full-result">
                    ${result.full_text ? result.full_text.replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>') : ''}
                </div>
            `}
            
            <div class="navigation">
                <button class="btn btn-secondary" onclick="shareResult()">
                    📤 Поделиться
                </button>
                <button class="btn btn-primary" onclick="showIntro()">
                    🏠 На главную
                </button>
            </div>
        </div>
    `;
}

// Покупка полного результата
async function purchaseFullResult() {
    if (!currentUser?.telegram_id) {
        showError('Ошибка авторизации');
        return;
    }

    try {
        showLoading();
        
        // Показываем подтверждение оплаты
        if (tg.showPopup) {
            tg.showPopup({
                title: '💳 Оплата',
                message: 'Разблокировать полный анализ за 149⭐?',
                buttons: [
                    {id: 'pay', type: 'default', text: 'Оплатить 149⭐'},
                    {type: 'cancel'}
                ]
            }, (buttonId) => {
                if (buttonId === 'pay') {
                    createStarsInvoice();
                } else {
                    showResult(testResult);
                }
            });
        } else {
            createStarsInvoice();
        }
        
    } catch (error) {
        console.error('Error initiating payment:', error);
        showError('Ошибка при создании платежа');
        showResult(testResult);
    }
}

// Создание invoice через Telegram Stars
async function createStarsInvoice() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/purchase/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product: 'unlock_result',
                user_id: currentUser.telegram_id,
                title: 'Полный психологический анализ',
                description: 'Разблокировка детального анализа вашей личности',
                payload: `unlock_result_${currentUser.telegram_id}_${Date.now()}`,
                currency: 'XTR',
                prices: [{label: 'Полный анализ', amount: 149}]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Если платеж уже был совершен
            if (data.already_purchased) {
                await loadFullResult();
                return;
            }
            
            // Открываем invoice для оплаты
            if (data.invoice_link && tg.openInvoice) {
                tg.openInvoice(data.invoice_link, async (status) => {
                    if (status === 'paid') {
                        if (tg.showAlert) {
                            tg.showAlert('✅ Платеж успешен! Загружаем полный анализ...');
                        }
                        await loadFullResult();
                    } else if (status === 'cancelled') {
                        showResult(testResult);
                    } else if (status === 'failed') {
                        showError('❌ Ошибка платежа. Попробуйте еще раз');
                        showResult(testResult);
                    }
                });
            } else {
                throw new Error('Не удалось создать invoice');
            }
        } else {
            throw new Error(data.error || 'Ошибка создания платежа');
        }
        
    } catch (error) {
        console.error('Error creating Stars invoice:', error);
        showError('Ошибка при создании платежа');
        showResult(testResult);
    }
}

// Загрузка полного результата
async function loadFullResult() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/psychtest/result/${currentUser.telegram_id}`);
        
        if (!response.ok) {
            throw new Error('Failed to load full result');
        }
        
        const data = await response.json();
        
        // Обновляем результат
        testResult.is_premium_unlocked = data.result.is_premium_unlocked;
        testResult.full_text = data.result.full_text;
        
        // Показываем обновленный результат
        showResult(testResult);
        
        // Показываем уведомление об успехе
        if (tg.showAlert) {
            tg.showAlert('🎉 Полный анализ разблокирован!');
        }
        
    } catch (error) {
        console.error('Error loading full result:', error);
        showError('Ошибка загрузки полного результата');
        showResult(testResult);
    }
}



// Поделиться результатом
function shareResult() {
    const shareText = `🧠 Мой психологический анализ: "${testResult.title}"

Пройди тест и узнай свой тип личности!

${window.location.origin}`;

    if (navigator.share) {
        navigator.share({
            title: 'Психологический AI-анализ',
            text: shareText,
            url: window.location.origin
        });
    } else if (tg.openTelegramLink) {
        const encodedText = encodeURIComponent(shareText);
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodedText}`);
    } else {
        // Fallback - копируем в буфер обмена
        navigator.clipboard.writeText(shareText);
        showNotification('Результат скопирован в буфер обмена!');
    }
}

// Открыть профиль
function openProfile() {
    if (tg.showPopup) {
        tg.showPopup({
            title: '👤 Профиль',
            message: 'Ваш профиль пока в разработке. Скоро здесь будет статистика ваших тестов и реферальные ссылки!',
            buttons: [{type: 'ok'}]
        });
    } else {
        alert('Профиль пока в разработке');
    }
}

// Показать ошибку
function showError(message) {
    if (tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// Показать уведомление
function showNotification(message) {
    if (tg.showPopup) {
        tg.showPopup({
            title: 'Уведомление',
            message: message,
            buttons: [{type: 'ok'}]
        });
    } else {
        alert(message);
    }
}

// Настройка Telegram WebApp
tg.onEvent('mainButtonClicked', () => {
    // Обработка главной кнопки Telegram
    if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
    } else {
        submitTest();
    }
});

// Настройка темы
if (tg.colorScheme === 'dark') {
    document.documentElement.style.setProperty('--background', '#1C1C1E');
    document.documentElement.style.setProperty('--surface', '#2C2C2E');
    document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
    document.documentElement.style.setProperty('--text-secondary', '#8E8E93');
}

// Обработка кнопки "Назад" Telegram
tg.onEvent('backButtonClicked', () => {
    if (currentQuestionIndex > 0) {
        previousQuestion();
    } else {
        tg.close();
    }
});

// Включаем кнопку "Назад" при начале теста
document.addEventListener('DOMContentLoaded', () => {
    tg.BackButton.show();
});