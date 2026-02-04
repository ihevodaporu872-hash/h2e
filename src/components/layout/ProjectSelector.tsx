import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Building2, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import styles from './ProjectSelector.module.css';

interface ProjectSelectorProps {
  onNewProject?: () => void;
}

export function ProjectSelector({ onNewProject }: ProjectSelectorProps) {
  const { projects, currentProject, setCurrentProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return styles.active;
      case 'completed': return styles.completed;
      case 'on_hold': return styles.onHold;
      default: return styles.archived;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активный';
      case 'completed': return 'Завершён';
      case 'on_hold': return 'Приостановлен';
      default: return 'В архиве';
    }
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Building2 size={18} className={styles.icon} />
        <div className={styles.projectInfo}>
          <span className={styles.projectName}>
            {currentProject?.name || 'Выберите проект'}
          </span>
          {currentProject && (
            <span className={styles.projectCode}>{currentProject.code}</span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Проекты</span>
            {onNewProject && (
              <button className={styles.newButton} onClick={onNewProject}>
                <Plus size={16} />
                Новый
              </button>
            )}
          </div>

          <div className={styles.projectList}>
            {projects.map(project => (
              <button
                key={project.id}
                className={`${styles.projectItem} ${currentProject?.id === project.id ? styles.selected : ''}`}
                onClick={() => {
                  setCurrentProject(project);
                  setIsOpen(false);
                }}
              >
                <div className={styles.projectItemInfo}>
                  <span className={styles.projectItemName}>{project.name}</span>
                  <span className={styles.projectItemMeta}>
                    {project.code} · {project.documents.length} документов
                  </span>
                </div>
                <div className={styles.projectItemRight}>
                  <span className={`${styles.statusBadge} ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  {currentProject?.id === project.id && (
                    <Check size={16} className={styles.checkIcon} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
