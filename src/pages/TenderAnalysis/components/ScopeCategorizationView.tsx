import { AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ScopeCard } from './ScopeCard';
import { useTender } from '../../../context/TenderContext';
import { CONSTRUCTION_SCOPES } from '../../../constants/scopes';
import styles from './ScopeCategorizationView.module.css';

interface ScopeCategorizationViewProps {
  onProceed: () => void;
}

export function ScopeCategorizationView({ onProceed }: ScopeCategorizationViewProps) {
  const { extractedItems, getItemsByScope, getUncategorizedItems } = useTender();

  const uncategorized = getUncategorizedItems();
  const totalItems = extractedItems.length;
  const categorizedCount = totalItems - uncategorized.length;
  const progressPercent = totalItems > 0 ? Math.round((categorizedCount / totalItems) * 100) : 0;

  const grandTotal = extractedItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className={styles.panel}>
      {/* Summary stats */}
      <Card>
        <div className={styles.summary}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalItems}</span>
            <span className={styles.statLabel}>Всего позиций</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{categorizedCount}</span>
            <span className={styles.statLabel}>Классифицировано</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatCurrency(grandTotal)}</span>
            <span className={styles.statLabel}>Общая сумма</span>
          </div>
          <div className={styles.stat}>
            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={styles.progressText}>{progressPercent}%</span>
            </div>
            <span className={styles.statLabel}>Прогресс</span>
          </div>
        </div>
      </Card>

      {/* Uncategorized warning */}
      {uncategorized.length > 0 && (
        <div className={styles.warning}>
          <AlertTriangle size={20} />
          <span>
            {uncategorized.length} позиций не классифицированы.
            Проверьте их вручную.
          </span>
        </div>
      )}

      {/* Scope grid */}
      <div className={styles.scopeGrid}>
        {CONSTRUCTION_SCOPES.map(scope => (
          <ScopeCard
            key={scope.id}
            scope={scope}
            items={getItemsByScope(scope.id)}
          />
        ))}
      </div>

      {/* Uncategorized items */}
      {uncategorized.length > 0 && (
        <Card title="Без категории" subtitle={`${uncategorized.length} позиций требуют ручной классификации`}>
          <div className={styles.uncategorizedList}>
            {uncategorized.slice(0, 20).map(item => (
              <div key={item.id} className={styles.uncategorizedItem}>
                <span className={styles.itemNumber}>{item.itemNumber}</span>
                <span className={styles.itemDesc}>{item.description}</span>
                <span className={styles.itemQty}>
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
            {uncategorized.length > 20 && (
              <div className={styles.moreItems}>
                + ещё {uncategorized.length - 20} позиций
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          onClick={onProceed}
          size="large"
          disabled={extractedItems.length === 0}
        >
          Перейти к проверке
        </Button>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);
}
