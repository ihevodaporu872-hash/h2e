import { useState, useEffect } from 'react';
import './App.css';

type Theme = 'light' | 'dark';

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: '📊' },
  { id: 'indicators', label: 'Основные показатели', icon: '📈' },
  { id: 'checklist', label: 'Чеклист', icon: '✅' },
  { id: 'nuances', label: 'Нюансы', icon: '⚠️' },
  { id: 'analytics', label: 'Аналитика', icon: '📉' },
  { id: 'faq', label: 'Вопросы-Ответы', icon: '❓' },
];

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowUserMenu(false);
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <div className="page-content">
            <h1>Дашборд</h1>
            <p className="page-description">Обзор ключевых метрик и показателей проекта</p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <span className="stat-value">24</span>
                  <span className="stat-label">Активных проектов</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <span className="stat-value">156</span>
                  <span className="stat-label">Документов</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                  <span className="stat-value">8</span>
                  <span className="stat-label">Требуют внимания</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span className="stat-value">92%</span>
                  <span className="stat-label">Выполнено</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'indicators':
        return (
          <div className="page-content">
            <h1>Основные показатели</h1>
            <p className="page-description">Ключевые индикаторы эффективности строительных работ</p>
            <div className="placeholder-content">
              <span className="placeholder-icon">📈</span>
              <p>Раздел в разработке</p>
            </div>
          </div>
        );
      case 'checklist':
        return (
          <div className="page-content">
            <h1>Чеклист</h1>
            <p className="page-description">Контрольные списки для проверки этапов работ</p>
            <div className="placeholder-content">
              <span className="placeholder-icon">✅</span>
              <p>Раздел в разработке</p>
            </div>
          </div>
        );
      case 'nuances':
        return (
          <div className="page-content">
            <h1>Нюансы</h1>
            <p className="page-description">Особенности и важные детали проектов</p>
            <div className="placeholder-content">
              <span className="placeholder-icon">⚠️</span>
              <p>Раздел в разработке</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="page-content">
            <h1>Аналитика</h1>
            <p className="page-description">Детальный анализ данных и отчётность</p>
            <div className="placeholder-content">
              <span className="placeholder-icon">📉</span>
              <p>Раздел в разработке</p>
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="page-content">
            <h1>Вопросы-Ответы</h1>
            <p className="page-description">Часто задаваемые вопросы и справочная информация</p>
            <div className="placeholder-content">
              <span className="placeholder-icon">❓</span>
              <p>Раздел в разработке</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏗️</span>
            {!sidebarCollapsed && <span className="logo-text">H2E Platform</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Развернуть' : 'Свернуть'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          >
            <span className="nav-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            {!sidebarCollapsed && <span className="nav-label">{theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h2 className="header-title">Аналитическая платформа</h2>
            <span className="header-subtitle">Строительный инжиниринг</span>
          </div>

          <div className="header-right">
            {/* Admin Button */}
            <button className="admin-btn" title="Панель администратора">
              <span className="admin-icon">⚙️</span>
              <span className="admin-label">Администратор</span>
            </button>

            {/* User Account */}
            <div className="user-account">
              <button
                className="user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {isLoggedIn ? '👤' : '○'}
                </div>
                <span className="user-name">
                  {isLoggedIn ? 'Инженер' : 'Гость'}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  {isLoggedIn ? (
                    <>
                      <div className="dropdown-header">
                        <span className="dropdown-email">engineer@h2e.ru</span>
                      </div>
                      <button className="dropdown-item">
                        <span>👤</span> Профиль
                      </button>
                      <button className="dropdown-item">
                        <span>⚙️</span> Настройки
                      </button>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <span>🚪</span> Выйти
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="dropdown-item" onClick={handleLogin}>
                        <span>🔑</span> Войти
                      </button>
                      <button className="dropdown-item">
                        <span>📝</span> Регистрация
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
