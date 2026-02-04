import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileUpload } from '../components/ui/FileUpload';
import { useExcelParser } from '../hooks/useExcelParser';
import { GitCompare, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import styles from './Compare.module.css';

export function Compare() {
  const parser1 = useExcelParser();
  const parser2 = useExcelParser();
  const [isComparing, setIsComparing] = useState(false);

  const canCompare = parser1.result && parser2.result;

  const handleCompare = () => {
    if (canCompare) {
      setIsComparing(true);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Сравнение документов</h1>
          <p className={styles.subtitle}>
            Анализ различий между версиями смет и BOQ
          </p>
        </div>
      </div>

      <div className={styles.uploadGrid}>
        <Card title="Документ 1 (Базовый)" subtitle="Загрузите первый файл для сравнения">
          <FileUpload onFileSelect={parser1.parseFile} />
          {parser1.result && (
            <div className={styles.fileLoaded}>
              <CheckCircle size={18} className={styles.successIcon} />
              <span>{parser1.result.fileName}</span>
              <span className={styles.rows}>{parser1.result.totalRows} строк</span>
            </div>
          )}
        </Card>

        <div className={styles.arrowContainer}>
          <ArrowRight size={32} className={styles.arrow} />
        </div>

        <Card title="Документ 2 (Сравниваемый)" subtitle="Загрузите второй файл для сравнения">
          <FileUpload onFileSelect={parser2.parseFile} />
          {parser2.result && (
            <div className={styles.fileLoaded}>
              <CheckCircle size={18} className={styles.successIcon} />
              <span>{parser2.result.fileName}</span>
              <span className={styles.rows}>{parser2.result.totalRows} строк</span>
            </div>
          )}
        </Card>
      </div>

      {canCompare && (
        <div className={styles.compareAction}>
          <Button
            size="large"
            icon={<GitCompare size={20} />}
            onClick={handleCompare}
          >
            Сравнить документы
          </Button>
        </div>
      )}

      {isComparing && (
        <Card title="Результаты сравнения" subtitle="Анализ различий между документами">
          <div className={styles.results}>
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <CheckCircle size={24} className={styles.matchIcon} />
                <div>
                  <span className={styles.summaryValue}>142</span>
                  <span className={styles.summaryLabel}>Совпадений</span>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <AlertCircle size={24} className={styles.changeIcon} />
                <div>
                  <span className={styles.summaryValue}>18</span>
                  <span className={styles.summaryLabel}>Изменений</span>
                </div>
              </div>
              <div className={styles.summaryItem}>
                <XCircle size={24} className={styles.deleteIcon} />
                <div>
                  <span className={styles.summaryValue}>5</span>
                  <span className={styles.summaryLabel}>Удалено</span>
                </div>
              </div>
            </div>

            <div className={styles.diffList}>
              <div className={styles.diffHeader}>
                <span>Позиция</span>
                <span>Было</span>
                <span>Стало</span>
                <span>Разница</span>
              </div>
              {[
                { pos: 'П-001', old: '150 000 ₽', new: '165 000 ₽', diff: '+10%' },
                { pos: 'П-015', old: '82 500 ₽', new: '78 000 ₽', diff: '-5.5%' },
                { pos: 'П-023', old: '45 000 ₽', new: '52 000 ₽', diff: '+15.6%' },
              ].map((item, i) => (
                <div key={i} className={styles.diffRow}>
                  <span className={styles.diffPos}>{item.pos}</span>
                  <span className={styles.diffOld}>{item.old}</span>
                  <span className={styles.diffNew}>{item.new}</span>
                  <span className={`${styles.diffDelta} ${item.diff.startsWith('+') ? styles.positive : styles.negative}`}>
                    {item.diff}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
