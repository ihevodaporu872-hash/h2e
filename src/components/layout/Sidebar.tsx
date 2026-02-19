import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  GitCompare,
  AlertTriangle,
  HelpCircle,
  Settings,
  FolderOpen,
  ChevronDown,
  Calculator,
  ClipboardList,
  BarChart3,
  Calendar,
  Users,
  Archive,
  PanelLeftClose,
  PanelLeft,
  Sparkles
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number | string;
  badgeType?: 'default' | 'warning' | 'danger' | 'success';
}

interface NavSection {
  title: string;
  collapsible?: boolean;
  items: NavItem[];
}

export function Sidebar() {
  const { currentProject } = useProject();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Рабочая область': true,
    'Документация': true,
    'Аналитика': false,
    'Система': true
  });

  const sections: NavSection[] = [
    {
      title: 'Рабочая область',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
        { to: '/documents', icon: FolderOpen, label: 'Документы', badge: currentProject?.documents.length || 0 },
      ]
    },
    {
      title: 'Документация',
      collapsible: true,
      items: [
        { to: '/estimates', icon: FileSpreadsheet, label: 'Сметы', badge: 3 },
        { to: '/boq', icon: ClipboardList, label: 'BOQ / Объёмы' },
        { to: '/boq-extract', icon: Sparkles, label: 'AI Извлечение BOQ', badgeType: 'success', badge: 'AI' },
        { to: '/compare', icon: GitCompare, label: 'Сравнение версий' },
        { to: '/calculations', icon: Calculator, label: 'Расчёты' },
      ]
    },
    {
      title: 'Аналитика',
      collapsible: true,
      items: [
        { to: '/reports', icon: BarChart3, label: 'Отчёты' },
        { to: '/risks', icon: AlertTriangle, label: 'Риски', badge: 2, badgeType: 'warning' },
        { to: '/schedule', icon: Calendar, label: 'График работ' },
      ]
    },
    {
      title: 'Коммуникации',
      collapsible: true,
      items: [
        { to: '/qa', icon: HelpCircle, label: 'Вопросы-Ответы', badge: 1, badgeType: 'danger' },
        { to: '/team', icon: Users, label: 'Команда' },
      ]
    },
    {
      title: 'Система',
      items: [
        { to: '/archive', icon: Archive, label: 'Архив' },
        { to: '/settings', icon: Settings, label: 'Настройки' },
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const getBadgeClass = (type?: string) => {
    switch (type) {
      case 'warning': return styles.badgeWarning;
      case 'danger': return styles.badgeDanger;
      case 'success': return styles.badgeSuccess;
      default: return styles.badgeDefault;
    }
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        {!collapsed && currentProject && (
          <div className={styles.projectInfo}>
            <span className={styles.projectLabel}>Текущий проект</span>
            <span className={styles.projectName}>{currentProject.name}</span>
          </div>
        )}
        <button
          className={styles.collapseButton}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {sections.map(section => (
          <div key={section.title} className={styles.navSection}>
            <button
              className={styles.sectionHeader}
              onClick={() => section.collapsible && toggleSection(section.title)}
              disabled={!section.collapsible}
            >
              {!collapsed && (
                <>
                  <span className={styles.sectionTitle}>{section.title}</span>
                  {section.collapsible && (
                    <ChevronDown
                      size={16}
                      className={`${styles.chevron} ${expandedSections[section.title] ? styles.expanded : ''}`}
                    />
                  )}
                </>
              )}
            </button>

            {(expandedSections[section.title] || !section.collapsible) && (
              <div className={styles.navItems}>
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.active : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={20} className={styles.navIcon} />
                    {!collapsed && (
                      <>
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.badge !== undefined && item.badge !== 0 && (
                          <span className={`${styles.badge} ${getBadgeClass(item.badgeType)}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge !== undefined && item.badge !== 0 && (
                      <span className={`${styles.badgeDot} ${getBadgeClass(item.badgeType)}`} />
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className={styles.sidebarFooter}>
          <div className={styles.storageInfo}>
            <div className={styles.storageBar}>
              <div className={styles.storageUsed} style={{ width: '45%' }} />
            </div>
            <span className={styles.storageText}>4.5 GB / 10 GB использовано</span>
          </div>
        </div>
      )}
    </aside>
  );
}
