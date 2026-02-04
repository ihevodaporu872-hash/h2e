import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MessageSquare, Plus, Search, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './QA.module.css';

const questions = [
  {
    id: 1,
    question: 'Уточнение по армированию фундаментной плиты',
    description: 'В проекте указан шаг армирования 200мм, однако по расчёту нагрузок требуется 150мм. Просьба уточнить.',
    author: 'Петров М.В.',
    date: '18.01.2025',
    status: 'answered',
    answer: 'Согласно актуализированным расчётам, принимается шаг 150мм. Изменения внесены в рабочую документацию.',
    answeredBy: 'ГИП Иванов А.С.',
    answeredDate: '19.01.2025'
  },
  {
    id: 2,
    question: 'Замена материала стеновых панелей',
    description: 'Предлагается заменить панели производителя "А" на аналог производителя "Б" с улучшенными характеристиками теплоизоляции.',
    author: 'Сидорова Е.П.',
    date: '20.01.2025',
    status: 'pending',
    answer: null,
    answeredBy: null,
    answeredDate: null
  },
  {
    id: 3,
    question: 'Согласование прокладки инженерных сетей',
    description: 'Необходимо согласовать пересечение трасс водопровода и кабельной канализации в осях 5-6.',
    author: 'Козлов И.Д.',
    date: '21.01.2025',
    status: 'in_review',
    answer: null,
    answeredBy: null,
    answeredDate: null
  },
];

export function QA() {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [filter, setFilter] = useState('');

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(filter.toLowerCase()) ||
    q.description.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Вопросы-Ответы</h1>
          <p className={styles.subtitle}>
            Реестр вопросов по проектной документации
          </p>
        </div>
        <Button icon={<Plus size={18} />}>
          Задать вопрос
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по вопросам..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <CheckCircle size={16} className={styles.answeredIcon} />
            1 отвечено
          </span>
          <span className={styles.statItem}>
            <Clock size={16} className={styles.pendingIcon} />
            2 ожидают
          </span>
        </div>
      </div>

      <div className={styles.questionsList}>
        {filteredQuestions.map(q => (
          <Card key={q.id} padding="none">
            <div className={styles.questionCard}>
              <div
                className={styles.questionHeader}
                onClick={() => toggleExpand(q.id)}
              >
                <div className={styles.questionIcon}>
                  <MessageSquare size={20} />
                </div>
                <div className={styles.questionInfo}>
                  <h3 className={styles.questionTitle}>{q.question}</h3>
                  <div className={styles.questionMeta}>
                    <span>{q.author}</span>
                    <span>•</span>
                    <span>{q.date}</span>
                  </div>
                </div>
                <span className={`${styles.status} ${styles[q.status.replace('_', '')]}`}>
                  {q.status === 'answered' && 'Отвечен'}
                  {q.status === 'pending' && 'Ожидает'}
                  {q.status === 'in_review' && 'На рассмотрении'}
                </span>
                <button className={styles.expandButton}>
                  {expandedId === q.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {expandedId === q.id && (
                <div className={styles.questionBody}>
                  <div className={styles.questionText}>
                    <span className={styles.label}>Вопрос:</span>
                    <p>{q.description}</p>
                  </div>

                  {q.answer && (
                    <div className={styles.answerBlock}>
                      <span className={styles.label}>Ответ:</span>
                      <p>{q.answer}</p>
                      <div className={styles.answerMeta}>
                        <span>{q.answeredBy}</span>
                        <span>•</span>
                        <span>{q.answeredDate}</span>
                      </div>
                    </div>
                  )}

                  {!q.answer && (
                    <div className={styles.noAnswer}>
                      <Clock size={18} />
                      <span>Ответ ещё не получен</span>
                    </div>
                  )}

                  <div className={styles.questionActions}>
                    {!q.answer && (
                      <Button size="small">
                        Ответить
                      </Button>
                    )}
                    <Button variant="ghost" size="small">
                      Редактировать
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
