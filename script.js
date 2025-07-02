// App State Management
class FitnessApp {
    constructor() {
        this.state = {
            currentDay: 1,
            completedDays: [],
            selectedGoal: null,
            xp: 0,
            streak: 0,
            achievements: [],
            isPremium: false,
            userName: 'Боец'
        };
        
        this.goals = {
            slim: {
                name: 'Убрать живот',
                icon: '🔥',
                exercises: this.getSlimExercises()
            },
            tone: {
                name: 'Подтянуть тело',
                icon: '✨',
                exercises: this.getToneExercises()
            },
            mass: {
                name: 'Набрать массу',
                icon: '💪',
                exercises: this.getMassExercises()
            }
        };
        
        this.achievementsList = [
            { id: 'first_day', name: 'Первый шаг', icon: '🎯', condition: 'Завершить 1 день', unlocked: false },
            { id: 'streak_3', name: '3 дня подряд', icon: '🔥', condition: 'Тренироваться 3 дня подряд', unlocked: false },
            { id: 'streak_7', name: 'Неделя силы', icon: '💪', condition: 'Тренироваться 7 дней подряд', unlocked: false },
            { id: 'streak_14', name: '2 недели', icon: '⚡', condition: 'Тренироваться 14 дней подряд', unlocked: false },
            { id: 'streak_30', name: 'Чемпион', icon: '👑', condition: 'Завершить весь курс', unlocked: false },
            { id: 'xp_500', name: 'Опытный', icon: '🌟', condition: 'Набрать 500 XP', unlocked: false },
            { id: 'xp_1000', name: 'Мастер', icon: '🏆', condition: 'Набрать 1000 XP', unlocked: false }
        ];
        
        this.motivationQuotes = [
            "Помни: каждое повторение приближает тебя к цели!",
            "Ты сильнее, чем думаешь!",
            "Боль временна, гордость вечна!",
            "Не останавливайся, когда больно. Останавливайся, когда закончишь!",
            "Твое тело может. Твой разум говорит 'могу'. Твоя душа говорит 'должен'!",
            "Каждый день — новая возможность стать лучше!",
            "Ты уже впереди всех, кто даже не начинал!",
            "Прогресс важнее совершенства!",
            "Сегодня ты на шаг ближе к своей цели!",
            "Твоя сила растет с каждой тренировкой!"
        ];
        
        this.init();
    }
    
    init() {
        this.loadState();
        this.initTelegramWebApp();
        this.generateCalendar();
        this.updateUI();
        this.checkAchievements();
    }
    
    initTelegramWebApp() {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            const tg = Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            // Получаем данные пользователя из Telegram
            if (tg.initDataUnsafe.user) {
                this.state.userName = tg.initDataUnsafe.user.first_name || 'Боец';
                document.getElementById('user-name').textContent = this.state.userName;
            }
            
            // Настраиваем цвета под тему Telegram
            if (tg.colorScheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
        }
    }
    
    loadState() {
        const saved = localStorage.getItem('fitnessAppState');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        }
    }
    
    saveState() {
        localStorage.setItem('fitnessAppState', JSON.stringify(this.state));
    }
    
    updateUI() {
        // Обновляем прогресс
        document.getElementById('current-day').textContent = this.state.currentDay;
        document.getElementById('xp-points').textContent = this.state.xp;
        document.getElementById('total-xp').textContent = this.state.xp;
        document.getElementById('streak-days').textContent = this.state.streak;
        document.getElementById('achievements-count').textContent = this.state.achievements.length;
        
        // Обновляем прогресс-бар
        const progressPercent = (this.state.completedDays.length / 30) * 100;
        document.getElementById('progress-fill').style.width = progressPercent + '%';
        
        // Обновляем календарь
        this.updateCalendar();
        
        // Обновляем достижения
        this.updateAchievements();
        
        // Обновляем кнопку задания дня
        this.updateDailyTaskButton();
    }
    
    generateCalendar() {
        const calendar = document.getElementById('calendar-grid');
        calendar.innerHTML = '';
        
        for (let day = 1; day <= 30; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.textContent = day;
            dayCell.setAttribute('data-day', day);
            
            if (this.state.completedDays.includes(day)) {
                dayCell.classList.add('completed');
            } else if (day === this.state.currentDay) {
                dayCell.classList.add('current');
            } else if (day > this.state.currentDay) {
                dayCell.classList.add('locked');
            }
            
            calendar.appendChild(dayCell);
        }
    }
    
    updateCalendar() {
        const cells = document.querySelectorAll('.day-cell');
        cells.forEach(cell => {
            const day = parseInt(cell.getAttribute('data-day'));
            cell.className = 'day-cell';
            
            if (this.state.completedDays.includes(day)) {
                cell.classList.add('completed');
            } else if (day === this.state.currentDay) {
                cell.classList.add('current');
            } else if (day > this.state.currentDay) {
                cell.classList.add('locked');
            }
        });
    }
    
    updateDailyTaskButton() {
        const btn = document.getElementById('daily-task-btn');
        if (this.state.completedDays.includes(this.state.currentDay)) {
            btn.textContent = 'Задание выполнено!';
            btn.disabled = true;
            btn.classList.add('completed');
        } else {
            btn.textContent = 'Выполнить задание дня';
            btn.disabled = false;
            btn.classList.remove('completed');
        }
    }
    
    selectGoal(goalType) {
        // Убираем выделение с других карточек
        document.querySelectorAll('.goal-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Выделяем выбранную карточку
        event.target.closest('.goal-card').classList.add('selected');
        
        this.state.selectedGoal = goalType;
        this.saveState();
        
        // Показываем экран прогресса через небольшую задержку
        setTimeout(() => {
            this.showProgressScreen();
        }, 300);
    }
    
    getDailyTask() {
        if (!this.state.selectedGoal) return null;
        
        const goalExercises = this.goals[this.state.selectedGoal].exercises;
        const dayIndex = (this.state.currentDay - 1) % goalExercises.length;
        return goalExercises[dayIndex];
    }
    
    showDailyTask() {
        const task = this.getDailyTask();
        if (!task) return;
        
        document.getElementById('task-title').textContent = `День ${this.state.currentDay} — Задание`;
        
        const taskDescription = document.getElementById('task-description');
        taskDescription.innerHTML = `
            <h3>${task.title}</h3>
            <ul>
                ${task.exercises.map(exercise => `<li>${exercise}</li>`).join('')}
            </ul>
        `;
        
        // Случайная мотивационная цитата
        const randomQuote = this.motivationQuotes[Math.floor(Math.random() * this.motivationQuotes.length)];
        document.getElementById('ai-motivation').innerHTML = `
            <div class="ai-avatar">🤖</div>
            <p>"${randomQuote}"</p>
        `;
    }
    
    completeTask() {
        if (this.state.completedDays.includes(this.state.currentDay)) return;
        
        // Добавляем день в завершенные
        this.state.completedDays.push(this.state.currentDay);
        
        // Начисляем XP
        const xpEarned = 50 + (this.state.currentDay * 5); // Прогрессивное начисление
        this.state.xp += xpEarned;
        
        // Обновляем стрик
        this.updateStreak();
        
        // Проверяем достижения
        this.checkAchievements();
        
        // Показываем экран награды
        this.showReward(xpEarned);
        
        // Переходим к следующему дню
        if (this.state.currentDay < 30) {
            this.state.currentDay++;
        }
        
        this.saveState();
    }
    
    updateStreak() {
        // Проверяем, выполнил ли пользователь задание вчера
        const yesterday = this.state.currentDay - 1;
        if (yesterday > 0 && this.state.completedDays.includes(yesterday)) {
            this.state.streak++;
        } else if (this.state.currentDay === 1) {
            this.state.streak = 1;
        } else {
            this.state.streak = 1; // Сброс стрика
        }
    }
    
    checkAchievements() {
        this.achievementsList.forEach(achievement => {
            if (achievement.unlocked) return;
            
            let shouldUnlock = false;
            
            switch (achievement.id) {
                case 'first_day':
                    shouldUnlock = this.state.completedDays.length >= 1;
                    break;
                case 'streak_3':
                    shouldUnlock = this.state.streak >= 3;
                    break;
                case 'streak_7':
                    shouldUnlock = this.state.streak >= 7;
                    break;
                case 'streak_14':
                    shouldUnlock = this.state.streak >= 14;
                    break;
                case 'streak_30':
                    shouldUnlock = this.state.completedDays.length >= 30;
                    break;
                case 'xp_500':
                    shouldUnlock = this.state.xp >= 500;
                    break;
                case 'xp_1000':
                    shouldUnlock = this.state.xp >= 1000;
                    break;
            }
            
            if (shouldUnlock) {
                achievement.unlocked = true;
                this.state.achievements.push(achievement.id);
                this.showAchievementNotification(achievement);
            }
        });
    }
    
    showAchievementNotification(achievement) {
        // Можно добавить уведомление о разблокированном достижении
        console.log(`Достижение разблокировано: ${achievement.name}`);
    }
    
    updateAchievements() {
        const grid = document.querySelector('.achievements-grid');
        grid.innerHTML = '';
        
        this.achievementsList.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = 'achievement';
            if (achievement.unlocked) {
                achievementEl.classList.add('unlocked');
            }
            
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
            `;
            
            grid.appendChild(achievementEl);
        });
    }
    
    showReward(xpEarned) {
        // Определяем тип награды
        const rewards = ['🏆', '🥇', '🎖️', '⭐', '💎', '🔥'];
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        
        document.getElementById('reward-medal').textContent = randomReward;
        document.getElementById('xp-earned').textContent = xpEarned;
        
        // Мотивационные сообщения в зависимости от прогресса
        let message = "Отлично! Ты на правильном пути!";
        const progress = this.state.completedDays.length / 30;
        
        if (progress >= 0.9) {
            message = "Невероятно! Ты почти у цели!";
        } else if (progress >= 0.5) {
            message = "Отлично! Ты уже прошел половину пути!";
        } else if (progress >= 0.25) {
            message = "Ты уже впереди 70% тех, кто начинал — не останавливайся!";
        }
        
        document.getElementById('reward-description').textContent = message;
        
        this.showScreen('reward-screen');
    }
    
    shareProgress() {
        const message = `🔥 Прокачиваю тело уже ${this.state.completedDays.length} дней!\n💪 Набрал ${this.state.xp} XP\n🎯 Цель: ${this.goals[this.state.selectedGoal]?.name}\n\nПрисоединяйся к челленджу!`;
        
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=https://your-app-url.com&text=${encodeURIComponent(message)}`);
        } else {
            // Fallback для веб-версии
            navigator.share({
                title: 'Прокачай тело за 30 дней',
                text: message,
                url: window.location.href
            }).catch(err => {
                // Копируем в буфер обмена
                navigator.clipboard.writeText(message);
                alert('Сообщение скопировано в буфер обмена!');
            });
        }
    }
    
    purchaseSubscription() {
        if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
            // Отправляем данные о покупке боту
            Telegram.WebApp.sendData(JSON.stringify({
                action: 'purchase_subscription',
                amount: 299,
                currency: 'RUB'
            }));
        } else {
            alert('Функция покупки доступна только в Telegram WebApp');
        }
    }
    
    // Навигация между экранами
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    showWelcomeScreen() {
        this.showScreen('welcome-screen');
    }
    
    showGoalScreen() {
        this.showScreen('goal-screen');
    }
    
    showProgressScreen() {
        this.updateUI();
        this.showScreen('progress-screen');
    }
    
    showDailyTaskScreen() {
        this.showDailyTask();
        this.showScreen('task-screen');
    }
    
    showProfileScreen() {
        this.updateUI();
        this.showScreen('profile-screen');
    }
    
    showSubscriptionScreen() {
        this.showScreen('subscription-screen');
    }
    
    // Упражнения для разных целей
    getSlimExercises() {
        return [
            {
                title: "Жиросжигающая тренировка",
                exercises: ["50 прыжков на месте", "30 приседаний", "20 отжиманий", "60 сек планка"]
            },
            {
                title: "Кардио + пресс",
                exercises: ["40 берпи", "60 скручиваний", "30 горных альпинистов", "20 выпадов"]
            },
            {
                title: "Интервальная тренировка",
                exercises: ["60 сек прыжки на месте", "30 приседаний", "60 сек планка", "20 отжиманий"]
            },
            {
                title: "Пресс и кардио",
                exercises: ["50 велосипедных скручиваний", "40 прыжков", "30 подъемов ног", "90 сек планка"]
            }
        ];
    }
    
    getToneExercises() {
        return [
            {
                title: "Общий тонус тела",
                exercises: ["30 приседаний", "15 отжиманий", "60 сек планка", "20 выпадов"]
            },
            {
                title: "Укрепление мышц",
                exercises: ["25 отжиманий", "40 приседаний", "30 подъемов ног", "75 сек планка"]
            },
            {
                title: "Функциональная тренировка",
                exercises: ["20 берпи", "35 приседаний", "20 отжиманий", "45 сек планка"]
            },
            {
                title: "Силовая выносливость",
                exercises: ["40 скручиваний", "30 отжиманий", "50 приседаний", "90 сек планка"]
            }
        ];
    }
    
    getMassExercises() {
        return [
            {
                title: "Силовая тренировка",
                exercises: ["40 отжиманий", "60 приседаний", "30 подтягиваний на турнике", "120 сек планка"]
            },
            {
                title: "Наращивание мышц",
                exercises: ["50 отжиманий", "80 приседаний", "40 выпадов", "25 подтягиваний"]
            },
            {
                title: "Взрывная сила",
                exercises: ["30 берпи", "60 приседаний с прыжком", "35 отжиманий", "150 сек планка"]
            },
            {
                title: "Функциональная сила",
                exercises: ["45 отжиманий", "100 приседаний", "50 выпадов", "30 подтягиваний"]
            }
        ];
    }
}

// Глобальные функции для HTML
let app;

function initApp() {
    app = new FitnessApp();
}

function showWelcomeScreen() {
    app.showWelcomeScreen();
}

function showGoalScreen() {
    app.showGoalScreen();
}

function showProgressScreen() {
    app.showProgressScreen();
}

function showDailyTaskScreen() {
    app.showDailyTaskScreen();
}

function showProfileScreen() {
    app.showProfileScreen();
}

function showSubscriptionScreen() {
    app.showSubscriptionScreen();
}

function selectGoal(goalType) {
    app.selectGoal(goalType);
}

function completeTask() {
    app.completeTask();
}

function shareProgress() {
    app.shareProgress();
}

function purchaseSubscription() {
    app.purchaseSubscription();
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Обработка закрытия WebApp
if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.onEvent('mainButtonClicked', function() {
        // Обработка нажатия главной кнопки
    });
    
    Telegram.WebApp.onEvent('backButtonClicked', function() {
        // Обработка нажатия кнопки назад
        const activeScreen = document.querySelector('.screen.active');
        const screenId = activeScreen.id;
        
        switch (screenId) {
            case 'goal-screen':
                app.showWelcomeScreen();
                break;
            case 'progress-screen':
                app.showGoalScreen();
                break;
            case 'task-screen':
            case 'profile-screen':
                app.showProgressScreen();
                break;
            case 'subscription-screen':
                app.showProfileScreen();
                break;
            case 'reward-screen':
                app.showProgressScreen();
                break;
            default:
                Telegram.WebApp.close();
        }
    });
}