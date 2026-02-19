import { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info, Eye, EyeOff, Lightbulb } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useTender } from '../../../context/TenderContext';
import type { Anomaly, CrossCheckResult, HiddenWork } from '../../../types/tender';
import styles from './ValidationPanel.module.css';

interface ValidationPanelProps {
  onProceed: () => void;
}

type TabType = 'crosscheck' | 'anomalies' | 'hidden' | 'readiness';

export function ValidationPanel({ onProceed }: ValidationPanelProps) {
  const { validationResults, isValidating, extractedItems } = useTender();
  const [activeTab, setActiveTab] = useState<TabType>('crosscheck');

  if (isValidating) {
    return (
      <Card>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Выполняется глубокая проверка документов...</p>
          <span className={styles.loadingHint}>
            Анализ соответствия, поиск аномалий, выявление скрытых работ
          </span>
        </div>
      </Card>
    );
  }

  if (!validationResults) {
    return (
      <Card>
        <div className={styles.empty}>
          <Info size={40} />
          <p>Результаты проверки пока недоступны</p>
          <span>Загрузите документы и выполните анализ</span>
        </div>
      </Card>
    );
  }

  const { crossCheckResults, anomalies, hiddenWorks, supplierReadiness, overallScore } = validationResults;

  const tabs = [
    { id: 'crosscheck' as const, label: 'Кросс-проверка', count: crossCheckResults.length },
    { id: 'anomalies' as const, label: 'Аномалии', count: anomalies.length },
    { id: 'hidden' as const, label: 'Скрытые работы', count: hiddenWorks.length },
    { id: 'readiness' as const, label: 'Готовность RFQ', count: null }
  ];

  return (
    <div className={styles.panel}>
      {/* Score overview */}
      <Card>
        <div className={styles.scoreSection}>
          <div className={styles.scoreCircle} data-score={getScoreLevel(overallScore)}>
            <span className={styles.scoreValue}>{overallScore}</span>
            <span className={styles.scoreLabel}>из 100</span>
          </div>
          <div className={styles.scoreInfo}>
            <h3>Общая оценка качества</h3>
            <p>{getScoreDescription(overallScore)}</p>
            <div className={styles.scoreStats}>
              <span className={styles.statItem}>
                <CheckCircle size={16} className={styles.iconSuccess} />
                {extractedItems.length} позиций
              </span>
              <span className={styles.statItem}>
                <AlertTriangle size={16} className={styles.iconWarning} />
                {anomalies.length} аномалий
              </span>
              <span className={styles.statItem}>
                <Lightbulb size={16} className={styles.iconInfo} />
                {hiddenWorks.length} скрытых работ
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={styles.tabBadge}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card padding="none">
        <div className={styles.tabContent}>
          {activeTab === 'crosscheck' && (
            <CrossCheckList results={crossCheckResults} />
          )}
          {activeTab === 'anomalies' && (
            <AnomalyList anomalies={anomalies} />
          )}
          {activeTab === 'hidden' && (
            <HiddenWorksList hiddenWorks={hiddenWorks} />
          )}
          {activeTab === 'readiness' && (
            <ReadinessReport report={supplierReadiness} />
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={onProceed} size="large">
          Сформировать BOQ
        </Button>
      </div>
    </div>
  );
}

function CrossCheckList({ results }: { results: CrossCheckResult[] }) {
  if (results.length === 0) {
    return <EmptyState message="Проблем при кросс-проверке не обнаружено" icon={CheckCircle} />;
  }

  return (
    <div className={styles.list}>
      {results.map(result => (
        <div key={result.id} className={`${styles.listItem} ${styles[result.severity]}`}>
          <SeverityIcon severity={result.severity} />
          <div className={styles.itemContent}>
            <span className={styles.itemTitle}>{result.description}</span>
            <span className={styles.itemMeta}>
              {result.sourceDocument} → {result.targetDocument}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnomalyList({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return <EmptyState message="Аномалий не обнаружено" icon={CheckCircle} />;
  }

  return (
    <div className={styles.list}>
      {anomalies.map(anomaly => (
        <div key={anomaly.id} className={`${styles.listItem} ${styles[anomaly.severity]}`}>
          <SeverityIcon severity={anomaly.severity} />
          <div className={styles.itemContent}>
            <span className={styles.itemTitle}>{anomaly.description}</span>
            {anomaly.suggestion && (
              <span className={styles.suggestion}>
                <Lightbulb size={14} />
                {anomaly.suggestion}
              </span>
            )}
            {anomaly.expected && anomaly.actual && (
              <span className={styles.comparison}>
                Ожидалось: {anomaly.expected} | Фактически: {anomaly.actual}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function HiddenWorksList({ hiddenWorks }: { hiddenWorks: HiddenWork[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (hiddenWorks.length === 0) {
    return <EmptyState message="Скрытых работ не обнаружено" icon={CheckCircle} />;
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={styles.list}>
      {hiddenWorks.map(work => (
        <div key={work.id} className={styles.hiddenWorkItem}>
          <div className={styles.hiddenWorkHeader} onClick={() => toggleExpanded(work.id)}>
            <Lightbulb size={18} className={styles.iconWarning} />
            <div className={styles.itemContent}>
              <span className={styles.itemTitle}>{work.description}</span>
              <span className={styles.itemMeta}>
                Обнаружено в: "{work.impliedBy}" | Раздел: {work.sourceSection}
              </span>
            </div>
            <div className={styles.confidenceBadge}>
              {Math.round(work.confidence * 100)}%
            </div>
            {expandedIds.has(work.id) ? <EyeOff size={16} /> : <Eye size={16} />}
          </div>

          {expandedIds.has(work.id) && work.suggestedItems.length > 0 && (
            <div className={styles.suggestedItems}>
              <span className={styles.suggestedTitle}>Предлагаемые позиции:</span>
              {work.suggestedItems.map((item, idx) => (
                <div key={idx} className={styles.suggestedItem}>
                  <span>{item.description}</span>
                  <span>{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReadinessReport({ report }: { report: { readyForRFQ: boolean; readinessScore: number; missingFields: Array<{ itemId: string; field: string }>; ambiguousDescriptions: Array<{ itemId: string; issue: string }> } }) {
  return (
    <div className={styles.readinessReport}>
      <div className={styles.readinessHeader}>
        <div className={`${styles.readinessBadge} ${report.readyForRFQ ? styles.ready : styles.notReady}`}>
          {report.readyForRFQ ? (
            <>
              <CheckCircle size={20} />
              <span>Готов к RFQ</span>
            </>
          ) : (
            <>
              <AlertTriangle size={20} />
              <span>Требуется доработка</span>
            </>
          )}
        </div>
        <div className={styles.readinessScore}>
          <span className={styles.scoreLabel}>Готовность:</span>
          <span className={styles.scoreValue}>{report.readinessScore}%</span>
        </div>
      </div>

      {report.missingFields.length > 0 && (
        <div className={styles.readinessSection}>
          <h4>Отсутствующие поля ({report.missingFields.length})</h4>
          <ul>
            {report.missingFields.slice(0, 10).map((field, idx) => (
              <li key={idx}>
                Позиция {field.itemId}: отсутствует {field.field}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.ambiguousDescriptions.length > 0 && (
        <div className={styles.readinessSection}>
          <h4>Неоднозначные описания ({report.ambiguousDescriptions.length})</h4>
          <ul>
            {report.ambiguousDescriptions.slice(0, 10).map((desc, idx) => (
              <li key={idx}>
                {desc.issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className={styles.emptyState}>
      <Icon size={32} className={styles.iconSuccess} />
      <span>{message}</span>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: 'info' | 'warning' | 'error' | 'low' | 'medium' | 'high' }) {
  switch (severity) {
    case 'error':
    case 'high':
      return <AlertCircle size={18} className={styles.iconDanger} />;
    case 'warning':
    case 'medium':
      return <AlertTriangle size={18} className={styles.iconWarning} />;
    default:
      return <Info size={18} className={styles.iconInfo} />;
  }
}

function getScoreLevel(score: number): string {
  if (score >= 80) return 'good';
  if (score >= 60) return 'warning';
  return 'danger';
}

function getScoreDescription(score: number): string {
  if (score >= 80) return 'Документация высокого качества, готова к формированию RFQ';
  if (score >= 60) return 'Документация приемлемого качества, рекомендуется устранить выявленные проблемы';
  return 'Обнаружены критические проблемы, требуется доработка документации';
}
