'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TelegramLoginButton from '@/components/TelegramLoginButton';
import ChatInterface from '@/components/ChatInterface';
import SubscriptionCard from '@/components/SubscriptionCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SparklesIcon, ChatBubbleLeftRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardPage user={user} />;
}

// Landing page for non-authenticated users
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                ChatMatch Assistant
              </h1>
            </div>
            <TelegramLoginButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-8">
              AI помощник для{' '}
              <span className="text-gradient">
                идеальных переписок
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-12">
              Продолжайте любой чат с помощью искусственного интеллекта. 
              Выберите тон общения и получите 3 персонализированных варианта ответа.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <TelegramLoginButton size="large" />
              <p className="text-sm text-gray-500">
                Войдите через Telegram для начала работы
              </p>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-telegram-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Как это работает
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Простой и эффективный способ улучшить ваше общение
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ChatBubbleLeftRightIcon className="h-8 w-8" />}
              title="Добавьте переписку"
              description="Скопируйте несколько последних сообщений из любого чата"
            />
            <FeatureCard
              icon={<UserGroupIcon className="h-8 w-8" />}
              title="Выберите тон"
              description="Флирт, дружелюбный или серьёзный — подберите подходящий стиль"
            />
            <FeatureCard
              icon={<SparklesIcon className="h-8 w-8" />}
              title="Получите варианты"
              description="ИИ создаст 3 уникальных ответа для продолжения беседы"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Начните прямо сейчас
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Войдите через Telegram и улучшите качество своего общения
          </p>
          <TelegramLoginButton size="large" variant="white" />
        </div>
      </section>
    </div>
  );
}

// Dashboard for authenticated users
function DashboardPage({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'chat' | 'subscription'>('chat');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">
                ChatMatch Assistant
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.photoUrl && (
                  <img
                    src={user.photoUrl}
                    alt={user.firstName || user.username}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName || user.username}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Чат
                </button>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'subscription'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Подписка
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'subscription' && <SubscriptionCard />}
      </main>
    </div>
  );
}

// Feature card component
function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}