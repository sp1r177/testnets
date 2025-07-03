// Telegram WebApp API
const tg = window.Telegram.WebApp;

// Состояние приложения
let appState = {
    user: null,
    currentQuestion: 0,
    questions: [],
    answers: [],
    result: null,
    products: []
};

// API базовый URL
const API_BASE = '/api';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Telegram WebApp...');
    
    // Настройка Telegram WebApp
    tg.ready();
    tg.expand();
    
    // Применяем тему Telegram
    applyTelegramTheme();
    
    // Получаем параметры запуска
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('ref');
    
    // Авторизация пользователя
    await authenticateUser(referrerId);
    
    // Привязываем события
    bindEvents();
    
    // Загружаем данные
    await loadInitialData();
    
    console.log('✅ App initialized successfully');
});

// Применение темы Telegram
function applyTelegramTheme() {
    const root = document.documentElement;
    
    if (tg.colorScheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
    
    // Применяем цвета из Telegram
    if (tg.themeParams) {
        root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
        root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        root.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
        root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f1f1f1');
    }
}

// Авторизация пользователя
async function authenticateUser(referrerId = null) {
    try {
        showLoader('Авторизация...');
        
        const initData = tg.initData || 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22username%22%3A%22testuser%22%7D';
        
        const response = await fetch(`${API_BASE}/auth/telegram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: initData,
                referrerId: referrerId
            })
        });
        
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        appState.user = data.user;
        
        console.log('✅ User authenticated:', appState.user);
        
        // Обновляем UI
        updateHomeScreen();
        
    } catch (error) {
        console.error('❌ Authentication error:', error);
        showNotification('Ошибка авторизации', 'error');
    } finally {
        hideLoader();
    }
}

// Загрузка начальных данных
async function loadInitialData() {
    try {
        // Загружаем вопросы
        const questionsResponse = await fetch(`${API_BASE}/questions`);
        if (questionsResponse.ok) {
            const questionsData = await questionsResponse.json();
            appState.questions = questionsData.questions;
        }
        
        // Загружаем продукты
        const productsResponse = await fetch(`${API_BASE}/purchase/products`);
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            appState.products = productsData.products;
        }
        
    } catch (error) {
        console.error('❌ Error loading initial data:', error);
    }
}

// Привязка событий
function bindEvents() {
    // Главный экран
    document.getElementById('start-test-btn').addEventListener('click', startTest);
    document.getElementById('view-result-btn').addEventListener('click', () => showScreen('result-screen'));
    document.getElementById('profile-btn').addEventListener('click', showProfile);
    
    // Экран теста
    document.getElementById('prev-btn').addEventListener('click', previousQuestion);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    
    // Экран результата
    document.getElementById('share-result-btn').addEventListener('click', shareResult);
    document.getElementById('get-premium-btn').addEventListener('click', () => showScreen('purchase-screen'));
    document.getElementById('home-btn').addEventListener('click', () => showScreen('home-screen'));
    
    // Экран покупки
    document.getElementById('back-to-result-btn').addEventListener('click', () => showScreen('result-screen'));
    
    // Экран профиля
    document.getElementById('copy-link-btn').addEventListener('click', copyReferralLink);
    document.getElementById('share-referral-btn').addEventListener('click', shareReferralLink);
    document.getElementById('profile-home-btn').addEventListener('click', () => showScreen('home-screen'));
    document.getElementById('withdraw-btn').addEventListener('click', withdrawEarnings);
}

// Обновление главного экрана
function updateHomeScreen() {
    if (!appState.user) return;
    
    // Показываем кнопку результата, если есть последний результат
    if (appState.user.last_result) {
        document.getElementById('view-result-btn').style.display = 'block';
    }
    
    // Обновляем текст кнопки в зависимости от использования бесплатного анализа
    const startBtn = document.getElementById('start-test-btn');
    if (appState.user.has_used_free_analysis) {
        startBtn.innerHTML = '<span>🔄 Пройти анализ заново</span>';
    }
}

// Показ экрана
function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    document.getElementById(screenId).classList.add('active');
    
    // Специальная логика для некоторых экранов
    if (screenId === 'purchase-screen') {
        renderProducts();
    } else if (screenId === 'profile-screen') {
        loadProfile();
    }
}

// Начало теста
function startTest() {
    if (appState.questions.length === 0) {
        showNotification('Вопросы не загружены', 'error');
        return;
    }
    
    // Проверяем, использовал ли пользователь бесплатный анализ
    if (appState.user.has_used_free_analysis) {
        if (appState.user.subscription_type === 'free') {
            showNotification('Бесплатный анализ уже использован. Приобретите подписку для повторного прохождения.', 'warning');
            showScreen('purchase-screen');
            return;
        }
    }
    
    appState.currentQuestion = 0;
    appState.answers = [];
    
    showScreen('test-screen');
    showQuestion();
}

// Показ вопроса
function showQuestion() {
    const question = appState.questions[appState.currentQuestion];
    if (!question) return;
    
    // Обновляем прогресс
    const progress = ((appState.currentQuestion + 1) / appState.questions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${appState.currentQuestion + 1} / ${appState.questions.length}`;
    
    // Показываем вопрос
    document.getElementById('question-text').textContent = question.text;
    
    // Показываем варианты ответов
    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.textContent = option;
        optionEl.addEventListener('click', () => selectOption(index, option));
        optionsContainer.appendChild(optionEl);
    });
    
    // Обновляем кнопки
    document.getElementById('prev-btn').disabled = appState.currentQuestion === 0;
    document.getElementById('next-btn').disabled = true;
    
    // Восстанавливаем выбранный ответ, если есть
    const existingAnswer = appState.answers[appState.currentQuestion];
    if (existingAnswer) {
        const options = optionsContainer.querySelectorAll('.option');
        options.forEach((option, index) => {
            if (question.options[index] === existingAnswer) {
                option.classList.add('selected');
                document.getElementById('next-btn').disabled = false;
            }
        });
    }
}

// Выбор варианта ответа
function selectOption(index, answer) {
    // Убираем выделение с других вариантов
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Выделяем выбранный вариант
    event.target.classList.add('selected');
    
    // Сохраняем ответ
    appState.answers[appState.currentQuestion] = answer;
    
    // Включаем кнопку "Далее"
    document.getElementById('next-btn').disabled = false;
    
    // Автоматически переходим к следующему вопросу через 300мс
    setTimeout(() => {
        if (appState.currentQuestion < appState.questions.length - 1) {
            nextQuestion();
        } else {
            finishTest();
        }
    }, 300);
}

// Предыдущий вопрос
function previousQuestion() {
    if (appState.currentQuestion > 0) {
        appState.currentQuestion--;
        showQuestion();
    }
}

// Следующий вопрос
function nextQuestion() {
    if (appState.currentQuestion < appState.questions.length - 1) {
        appState.currentQuestion++;
        showQuestion();
    } else {
        finishTest();
    }
}

// Завершение теста
async function finishTest() {
    try {
        showLoader('Анализируем ваши ответы...');
        
        // Сохраняем все ответы
        for (let i = 0; i < appState.answers.length; i++) {
            await fetch(`${API_BASE}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: appState.user.id,
                    questionId: i + 1,
                    answer: appState.answers[i]
                })
            });
        }
        
        // Генерируем результат
        const resultResponse = await fetch(`${API_BASE}/result/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: appState.user.id
            })
        });
        
        if (!resultResponse.ok) {
            throw new Error('Failed to generate result');
        }
        
        const resultData = await resultResponse.json();
        appState.result = resultData.result;
        
        // Показываем результат
        showResult();
        
    } catch (error) {
        console.error('❌ Error finishing test:', error);
        showNotification('Ошибка при обработке результатов', 'error');
    } finally {
        hideLoader();
    }
}

// Показ результата
function showResult() {
    const result = appState.result;
    if (!result) return;
    
    // Обновляем заголовок
    document.getElementById('archetype-name').textContent = result.archetype;
    document.getElementById('archetype-description').textContent = result.short_description;
    
    // Показываем сильные стороны
    const strengthsList = document.getElementById('strengths-list');
    strengthsList.innerHTML = '';
    result.strengths.forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
    });
    
    // Показываем слабые стороны
    const weaknessesList = document.getElementById('weaknesses-list');
    weaknessesList.innerHTML = '';
    result.weaknesses.forEach(weakness => {
        const li = document.createElement('li');
        li.textContent = weakness;
        weaknessesList.appendChild(li);
    });
    
    // Показываем рекомендации
    const recommendationsList = document.getElementById('recommendations-list');
    recommendationsList.innerHTML = '';
    result.recommendations.forEach(recommendation => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        recommendationsList.appendChild(li);
    });
    
    showScreen('result-screen');
    
    // Обновляем пользователя
    appState.user.has_used_free_analysis = true;
    updateHomeScreen();
}

// Поделиться результатом
function shareResult() {
    if (!appState.result) return;
    
    const referralLink = `https://t.me/${tg.initDataUnsafe?.user?.username || 'relationship_ai_bot'}?start=ref_${appState.user.id}`;
    
    const shareText = `🧠 Я узнал свой архетип в отношениях!

Результат: ${appState.result.archetype}
${appState.result.short_description}

🎁 Пройди бесплатный AI-анализ по моей ссылке:
${referralLink}`;
    
    if (tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`);
    } else {
        copyToClipboard(shareText);
        showNotification('Текст для репоста скопирован!', 'success');
    }
}

// Показ продуктов
function renderProducts() {
    const container = document.getElementById('products-list');
    container.innerHTML = '';
    
    Object.entries(appState.products).forEach(([key, product], index) => {
        const productEl = document.createElement('div');
        productEl.className = `product-card ${index === 1 ? 'popular' : ''}`;
        
        productEl.innerHTML = `
            <div class="product-header">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price} ₽</div>
            </div>
            <div class="product-description">${product.description}</div>
            <button class="btn-primary product-buy-btn" onclick="buyProduct('${key}')">
                ⭐ Купить за ${product.stars_price} Stars
            </button>
            <button class="btn-outline product-buy-btn" onclick="buyProductCrypto('${key}')" style="margin-top: 8px;">
                💳 Купить за ${product.price} ₽
            </button>
        `;
        
        container.appendChild(productEl);
    });
}

// Покупка через Stars
async function buyProduct(productType) {
    try {
        showLoader('Создаем счет для оплаты...');
        
        const response = await fetch(`${API_BASE}/purchase/create-invoice/stars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: appState.user.telegram_id,
                productType: productType
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create invoice');
        }
        
        const data = await response.json();
        showNotification('Счет создан! Проверьте Telegram для оплаты.', 'success');
        
    } catch (error) {
        console.error('❌ Purchase error:', error);
        showNotification('Ошибка при создании счета', 'error');
    } finally {
        hideLoader();
    }
}

// Покупка через CryptoBot
async function buyProductCrypto(productType) {
    try {
        showLoader('Создаем счет для оплаты...');
        
        const response = await fetch(`${API_BASE}/purchase/create-invoice/crypto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: appState.user.telegram_id,
                productType: productType
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create crypto invoice');
        }
        
        const data = await response.json();
        
        // Открываем ссылку для оплаты
        if (tg.openLink) {
            tg.openLink(data.invoice_url);
        } else {
            window.open(data.invoice_url, '_blank');
        }
        
    } catch (error) {
        console.error('❌ Crypto purchase error:', error);
        showNotification('Ошибка при создании счета', 'error');
    } finally {
        hideLoader();
    }
}

// Показ профиля
async function showProfile() {
    showScreen('profile-screen');
    await loadProfile();
}

// Загрузка профиля
async function loadProfile() {
    try {
        // Загружаем данные профиля
        const response = await fetch(`${API_BASE}/auth/profile/${appState.user.telegram_id}`);
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const data = await response.json();
        const profile = data.profile;
        
        // Обновляем UI профиля
        document.getElementById('profile-name').textContent = profile.first_name || 'Пользователь';
        document.getElementById('subscription-badge').textContent = profile.subscription_type.toUpperCase();
        
        // Статистика
        document.getElementById('total-referrals').textContent = profile.referral_stats.total_referrals || 0;
        document.getElementById('earned-stars').textContent = profile.referral_stats.total_rewards || 0;
        document.getElementById('current-balance').textContent = profile.stars_balance || 0;
        
        // Реферальная ссылка
        document.getElementById('referral-link').value = profile.referral_link;
        
        // Показываем секцию вывода, если есть баланс
        if (profile.stars_balance > 0) {
            document.getElementById('withdraw-section').style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ Profile load error:', error);
        showNotification('Ошибка загрузки профиля', 'error');
    }
}

// Копирование реферальной ссылки
function copyReferralLink() {
    const linkInput = document.getElementById('referral-link');
    copyToClipboard(linkInput.value);
    showNotification('Ссылка скопирована!', 'success');
}

// Поделиться реферальной ссылкой
async function shareReferralLink() {
    try {
        const response = await fetch(`${API_BASE}/referral/link/${appState.user.telegram_id}`);
        
        if (!response.ok) {
            throw new Error('Failed to get referral link');
        }
        
        const data = await response.json();
        
        if (tg.openTelegramLink) {
            tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(data.referral_link)}&text=${encodeURIComponent(data.share_text)}`);
        } else {
            copyToClipboard(data.share_text);
            showNotification('Текст для приглашения скопирован!', 'success');
        }
        
    } catch (error) {
        console.error('❌ Share referral error:', error);
        showNotification('Ошибка при получении реферальной ссылки', 'error');
    }
}

// Вывод заработка
async function withdrawEarnings() {
    const balance = parseInt(document.getElementById('current-balance').textContent);
    
    if (balance < 100) {
        showNotification('Минимальная сумма для вывода: 100 ⭐', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/referral/withdraw/${appState.user.telegram_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: balance,
                method: 'stars_to_money'
            })
        });
        
        if (!response.ok) {
            throw new Error('Withdrawal failed');
        }
        
        showNotification('Заявка на вывод отправлена!', 'success');
        loadProfile(); // Обновляем профиль
        
    } catch (error) {
        console.error('❌ Withdrawal error:', error);
        showNotification('Ошибка при выводе средств', 'error');
    }
}

// Утилиты
function showLoader(text = 'Загрузка...') {
    const loader = document.getElementById('loader');
    loader.querySelector('p').textContent = text;
    loader.classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

function showNotification(text, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = text;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Обработка haptic feedback
function hapticFeedback(type = 'impact') {
    if (tg.HapticFeedback) {
        if (type === 'impact') {
            tg.HapticFeedback.impactOccurred('medium');
        } else if (type === 'notification') {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
}

// Добавляем haptic feedback к кнопкам
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        hapticFeedback('impact');
    }
});

// Глобальные функции для HTML
window.buyProduct = buyProduct;
window.buyProductCrypto = buyProductCrypto;