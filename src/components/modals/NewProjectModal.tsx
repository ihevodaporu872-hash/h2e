import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useProject } from '../../context/ProjectContext';
import { useNotification } from '../../context/NotificationContext';
import type { ProjectStatus } from '../../types/project';
import styles from './NewProjectModal.module.css';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { addProject, setCurrentProject } = useProject();
  const { success } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    client: '',
    status: 'active' as ProjectStatus,
    budget: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProject = addProject({
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      client: formData.client || undefined,
      status: formData.status,
      startDate: new Date(),
      budget: formData.budget ? parseFloat(formData.budget) : undefined
    });

    setCurrentProject(newProject);
    success('Проект создан', `Проект "${formData.name}" успешно создан`);

    setFormData({
      name: '',
      code: '',
      description: '',
      client: '',
      status: 'active',
      budget: ''
    });

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isValid = formData.name.trim() && formData.code.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Новый проект"
      size="medium"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Создать проект
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Название проекта *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder='Например: ЖК "Новый Горизонт"'
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Код проекта *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className={styles.input}
              placeholder="NH-2025"
              required
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="Краткое описание проекта..."
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Заказчик</label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className={styles.input}
              placeholder='ООО "Компания"'
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Статус</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="active">Активный</option>
              <option value="on_hold">Приостановлен</option>
              <option value="completed">Завершён</option>
              <option value="archived">В архиве</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Бюджет (₽)</label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className={styles.input}
            placeholder="0"
            min="0"
          />
        </div>
      </form>
    </Modal>
  );
}
