// Глобальные переменные
let tg = window.Telegram?.WebApp;
let questions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let isSubmitting = false;

// Состояние приложения
const AppState = {
    MAIN: 'main',
    QUESTIONS: 'questions', 
    LOADING: 'loading',
    RESULT: 'result',
    ERROR: 'error'
};

let currentState = AppState.MAIN;

// DOM элементы
const screens = {
    main: document.getElementById('main-screen'),
    questions: document.getElementById('questions-screen'),
    loading: document.getElementById('loading-screen'),
    result: document.getElementById('result-screen'),
    error: document.getElementById('error-screen')
};

const elements = {
    startBtn: document.getElementById('start-btn'),
    progress: document.getElementById('progress'),
    questionCounter: document.getElementById('question-counter'),
    questionText: document.getElementById('question-text'),
    answersContainer: document.getElementById('answers-container'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    resultContent: document.getElementById('result-content'),
    restartBtn: document.getElementById('restart-btn'),
    shareBtn: document.getElementById('share-btn'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    fabBtn: document.getElementById('fab-btn')
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Инициализация Telegram WebApp
function initializeApp() {
    console.log('🚀 Initializing Telegram WebApp...');
    
    if (tg) {
        // Настройка WebApp
        tg.ready();
        tg.expand();
        
        // Настройка главной кнопки
        tg.MainButton.hide();
        
        // Настройка кнопки назад
        tg.BackButton.hide();
        
        // Включаем подтверждение закрытия
        tg.enableClosingConfirmation();
        
        // Применяем тему
        applyTelegramTheme();
        
        console.log('✅ Telegram WebApp initialized');
        console.log('📱 Platform:', tg.platform);
        console.log('🎨 Color scheme:', tg.colorScheme);
    } else {
        console.warn('⚠️ Telegram WebApp not available');
    }
    
    // Показываем главный экран
    showScreen(AppState.MAIN);
}

// Применение темы Telegram
function applyTelegramTheme() {
    if (!tg) return;
    
    const root = document.documentElement;
    const themeParams = tg.themeParams;
    
    // Применяем CSS переменные темы
    for (const [key, value] of Object.entries(themeParams)) {
        root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Главный экран
    elements.startBtn.addEventListener('click', startQuiz);
    
    // Экран вопросов
    elements.prevBtn.addEventListener('click', previousQuestion);
    elements.nextBtn.addEventListener('click', nextQuestion);
    
    // Экран результата
    elements.restartBtn.addEventListener('click', restartQuiz);
    elements.shareBtn.addEventListener('click', shareResult);
    
    // Экран ошибки
    elements.retryBtn.addEventListener('click', retryLastAction);
    
    // FAB
    if (elements.fabBtn) {
        elements.fabBtn.addEventListener('click', () => {
            if (tg) {
                tg.showPopup({
                    title: 'Помощь',
                    message: 'Нужна помощь? Обратитесь в поддержку.',
                    buttons: [
                        { type: 'ok', text: 'Понятно' }
                    ]
                });
            }
        });
    }
    
    // Обработка кнопки назад Telegram
    if (tg) {
        tg.BackButton.onClick(() => {
            handleBackButton();
        });
    }
}

// Управление экранами
function showScreen(screenName) {
    // Скрываем все экраны
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        currentState = screenName;
        
        // Обновляем состояние Telegram WebApp
        updateTelegramUI();
    }
}

// Обновление UI Telegram WebApp
function updateTelegramUI() {
    if (!tg) return;
    
    switch (currentState) {
        case AppState.MAIN:
            tg.BackButton.hide();
            tg.MainButton.hide();
            break;
            
        case AppState.QUESTIONS:
            tg.BackButton.show();
            if (currentQuestionIndex < questions.length - 1) {
                updateMainButton('Далее', nextQuestion);
            } else {
                updateMainButton('Завершить', finishQuiz);
            }
            break;
            
        case AppState.LOADING:
            tg.BackButton.hide();
            tg.MainButton.hide();
            break;
            
        case AppState.RESULT:
            tg.BackButton.hide();
            updateMainButton('Поделиться', shareResult);
            break;
            
        case AppState.ERROR:
            tg.BackButton.show();
            updateMainButton('Попробовать снова', retryLastAction);
            break;
    }
}

// Обновление главной кнопки Telegram
function updateMainButton(text, onClick) {
    if (!tg) return;
    
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
}

// Обработка кнопки назад
function handleBackButton() {
    switch (currentState) {
        case AppState.QUESTIONS:
            if (currentQuestionIndex > 0) {
                previousQuestion();
            } else {
                showScreen(AppState.MAIN);
            }
            break;
            
        case AppState.ERROR:
            showScreen(AppState.MAIN);
            break;
            
        default:
            showScreen(AppState.MAIN);
            break;
    }
}

// API функции
async function fetchQuestions() {
    try {
        console.log('📥 Fetching questions...');
        const response = await fetch('/api/questions');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Questions loaded:', data.length);
        return data;
    } catch (error) {
        console.error('❌ Error fetching questions:', error);
        throw error;
    }
}

async function submitAnswers(answers) {
    try {
        console.log('📤 Submitting answers...');
        const response = await fetch('/api/answers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answers })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Answers submitted');
        return data;
    } catch (error) {
        console.error('❌ Error submitting answers:', error);
        throw error;
    }
}

async function generateResult() {
    try {
        console.log('🔄 Generating result...');
        const response = await fetch('/api/result/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Result generated');
        return data;
    } catch (error) {
        console.error('❌ Error generating result:', error);
        throw error;
    }
}

// Основная логика квиза
async function startQuiz() {
    try {
        showScreen(AppState.LOADING);
        
        questions = await fetchQuestions();
        userAnswers = new Array(questions.length).fill(null);
        currentQuestionIndex = 0;
        
        showScreen(AppState.QUESTIONS);
        displayQuestion();
    } catch (error) {
        showError('Не удалось загрузить вопросы. Проверьте соединение и попробуйте снова.');
    }
}

function displayQuestion() {
    if (!questions[currentQuestionIndex]) return;
    
    const question = questions[currentQuestionIndex];
    
    // Обновляем прогресс
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    elements.progress.style.width = `${progress}%`;
    
    // Обновляем счетчик
    elements.questionCounter.textContent = `${currentQuestionIndex + 1} из ${questions.length}`;
    
    // Обновляем текст вопроса
    elements.questionText.textContent = question.text || question.question;
    
    // Отображаем варианты ответов
    displayAnswers(question.answers || question.options);
    
    // Обновляем кнопки навигации
    updateNavigationButtons();
}

function displayAnswers(answers) {
    elements.answersContainer.innerHTML = '';
    
    answers.forEach((answer, index) => {
        const answerElement = document.createElement('div');
        answerElement.className = 'answer-option';
        answerElement.textContent = answer.text || answer;
        answerElement.dataset.index = index;
        answerElement.dataset.value = answer.value || answer;
        
        // Проверяем, выбран ли этот ответ
        if (userAnswers[currentQuestionIndex] === (answer.value || answer)) {
            answerElement.classList.add('selected');
        }
        
        answerElement.addEventListener('click', () => selectAnswer(answer.value || answer, answerElement));
        
        elements.answersContainer.appendChild(answerElement);
    });
}

function selectAnswer(value, element) {
    // Убираем выделение с других ответов
    elements.answersContainer.querySelectorAll('.answer-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Выделяем выбранный ответ
    element.classList.add('selected');
    
    // Сохраняем ответ
    userAnswers[currentQuestionIndex] = value;
    
    // Обновляем кнопки
    updateNavigationButtons();
    
    // Обратная связь
    if (tg) {
        tg.HapticFeedback.selectionChanged();
    }
}

function updateNavigationButtons() {
    const hasAnswer = userAnswers[currentQuestionIndex] !== null;
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    
    elements.prevBtn.disabled = isFirstQuestion;
    elements.nextBtn.disabled = !hasAnswer;
    elements.nextBtn.textContent = isLastQuestion ? 'Завершить' : 'Далее →';
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        
        if (tg) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1 && userAnswers[currentQuestionIndex] !== null) {
        currentQuestionIndex++;
        displayQuestion();
        
        if (tg) {
            tg.HapticFeedback.impactOccurred('light');
        }
    } else if (currentQuestionIndex === questions.length - 1) {
        finishQuiz();
    }
}

async function finishQuiz() {
    if (isSubmitting) return;
    
    // Проверяем, что все вопросы отвечены
    const unansweredQuestions = userAnswers.filter(answer => answer === null).length;
    if (unansweredQuestions > 0) {
        if (tg) {
            tg.showAlert(`Пожалуйста, ответьте на все вопросы. Осталось: ${unansweredQuestions}`);
        } else {
            alert(`Пожалуйста, ответьте на все вопросы. Осталось: ${unansweredQuestions}`);
        }
        return;
    }
    
    try {
        isSubmitting = true;
        showScreen(AppState.LOADING);
        
        if (tg) {
            tg.HapticFeedback.impactOccurred('medium');
        }
        
        // Отправляем ответы
        await submitAnswers(userAnswers);
        
        // Генерируем результат
        const result = await generateResult();
        
        // Отображаем результат
        displayResult(result);
        showScreen(AppState.RESULT);
        
    } catch (error) {
        showError('Не удалось обработать ваши ответы. Попробуйте ещё раз.');
    } finally {
        isSubmitting = false;
    }
}

function displayResult(result) {
    let content = '';
    
    if (typeof result === 'string') {
        content = result;
    } else if (result.text) {
        content = result.text;
    } else if (result.result) {
        content = result.result;
    } else {
        content = 'Ваш результат готов! Спасибо за прохождение теста.';
    }
    
    elements.resultContent.innerHTML = content;
}

function shareResult() {
    if (tg) {
        // Отправляем данные обратно в чат
        const resultData = {
            action: 'quiz_completed',
            timestamp: new Date().toISOString(),
            questionsCount: questions.length
        };
        
        tg.sendData(JSON.stringify(resultData));
        tg.close();
    } else {
        // Fallback для веб-версии
        if (navigator.share) {
            navigator.share({
                title: 'Мой результат теста',
                text: 'Я прошёл тест! Попробуйте и вы.',
                url: window.location.href
            });
        } else {
            // Копируем в буфер обмена
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            });
        }
    }
}

function restartQuiz() {
    if (tg) {
        tg.showConfirm('Вы уверены, что хотите начать заново?', (confirmed) => {
            if (confirmed) {
                resetQuiz();
                startQuiz();
            }
        });
    } else {
        if (confirm('Вы уверены, что хотите начать заново?')) {
            resetQuiz();
            startQuiz();
        }
    }
}

function resetQuiz() {
    questions = [];
    userAnswers = [];
    currentQuestionIndex = 0;
    isSubmitting = false;
}

function showError(message) {
    elements.errorMessage.textContent = message;
    showScreen(AppState.ERROR);
    
    if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
    }
}

function retryLastAction() {
    switch (currentState) {
        case AppState.ERROR:
            startQuiz();
            break;
        default:
            showScreen(AppState.MAIN);
            break;
    }
}

// Обработка ошибок
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
    showError('Произошла неожиданная ошибка. Попробуйте обновить страницу.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
    showError('Произошла ошибка при загрузке данных. Проверьте соединение.');
});

// Экспорт для отладки
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        fetchQuestions,
        submitAnswers,
        generateResult,
        showScreen
    };
}

// Отладочная информация
console.log('📱 App.js loaded successfully');
console.log('🔧 Available functions:', Object.keys(window).filter(key => typeof window[key] === 'function'));