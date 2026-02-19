import { useState } from 'react';
import { ChevronDown, ChevronUp, Box, Building2, Mountain, Fence, Droplets, ArrowDown, Grid3x3, Layers, Wrench, Home, Shield, Paintbrush, Trees } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ScopeDefinition, ExtractedBOQItem } from '../../../types/tender';
import styles from './ScopeCard.module.css';

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Mountain, Fence, Droplets, ArrowDown, Box, Grid3x3, Layers, Wrench, Home, Shield, Paintbrush, Trees
};

interface ScopeCardProps {
  scope: ScopeDefinition;
  items: ExtractedBOQItem[];
  onClick?: () => void;
}

export function ScopeCard({ scope, items, onClick }: ScopeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get icon from map
  const IconComponent = ICON_MAP[scope.icon] || Box;

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={styles.card}
      style={{ '--scope-color': scope.color } as React.CSSProperties}
      onClick={onClick}
    >
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <IconComponent size={24} />
        </div>

        <div className={styles.info}>
          <h4 className={styles.nameRu}>{scope.nameRu}</h4>
          <span className={styles.nameEn}>{scope.nameEn}</span>
        </div>

        <div className={styles.badge}>
          {items.length}
        </div>
      </div>

      {items.length > 0 && (
        <>
          <div className={styles.subtotal}>
            {formatCurrency(subtotal)}
          </div>

          <button className={styles.expandBtn} onClick={toggleExpand}>
            {isExpanded ? (
              <>
                <span>Скрыть</span>
                <ChevronUp size={16} />
              </>
            ) : (
              <>
                <span>Показать позиции</span>
                <ChevronDown size={16} />
              </>
            )}
          </button>

          {isExpanded && (
            <div className={styles.itemList}>
              {items.slice(0, 10).map(item => (
                <div key={item.id} className={styles.item}>
                  <span className={styles.itemNumber}>{item.itemNumber}</span>
                  <span className={styles.itemDesc}>{item.description}</span>
                  <span className={styles.itemQty}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
              {items.length > 10 && (
                <div className={styles.moreItems}>
                  + ещё {items.length - 10} позиций
                </div>
              )}
            </div>
          )}
        </>
      )}

      {items.length === 0 && (
        <div className={styles.empty}>
          Нет позиций
        </div>
      )}
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
