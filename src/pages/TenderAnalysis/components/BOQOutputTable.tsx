import { useState } from 'react';
import { FileSpreadsheet, Printer, Edit2, Save } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useTender } from '../../../context/TenderContext';
import { CONSTRUCTION_SCOPES } from '../../../constants/scopes';
import type { ExtractedBOQItem } from '../../../types/tender';
import styles from './BOQOutputTable.module.css';

export function BOQOutputTable() {
  const { extractedItems, getItemsByScope } = useTender();
  const [isEditing, setIsEditing] = useState(false);

  // Group items by scope
  const scopedItems = CONSTRUCTION_SCOPES.map(scope => ({
    scope,
    items: getItemsByScope(scope.id),
    subtotal: getItemsByScope(scope.id).reduce((sum, item) => sum + (item.amount || 0), 0)
  })).filter(group => group.items.length > 0);

  const grandTotal = extractedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalItems = extractedItems.length;

  const handleExportExcel = async () => {
    // For now, log a message - actual implementation would use xlsx library
    console.log('Exporting to Excel...');
    alert('Экспорт в Excel будет доступен после подключения библиотеки xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.panel}>
      {/* Actions header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2>Сформированный BOQ</h2>
          <span>{totalItems} позиций • {scopedItems.length} разделов</span>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            icon={isEditing ? <Save size={16} /> : <Edit2 size={16} />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Сохранить' : 'Редактировать'}
          </Button>
          <Button
            variant="outline"
            icon={<Printer size={16} />}
            onClick={handlePrint}
          >
            Печать
          </Button>
          <Button
            icon={<FileSpreadsheet size={16} />}
            onClick={handleExportExcel}
          >
            Экспорт в Excel
          </Button>
        </div>
      </div>

      {/* BOQ Table */}
      <Card padding="none">
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colNumber}>№ п/п</th>
                <th className={styles.colDescription}>Наименование работ</th>
                <th className={styles.colUnit}>Ед. изм.</th>
                <th className={styles.colQty}>Кол-во</th>
                <th className={styles.colRate}>Расценка</th>
                <th className={styles.colAmount}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {scopedItems.map(({ scope, items, subtotal }) => (
                <ScopeSection
                  key={scope.id}
                  scope={scope}
                  items={items}
                  subtotal={subtotal}
                  isEditing={isEditing}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.grandTotalRow}>
                <td colSpan={5}>ИТОГО:</td>
                <td className={styles.totalAmount}>{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <Card title="Сводка по разделам">
        <div className={styles.summaryGrid}>
          {scopedItems.map(({ scope, items, subtotal }) => (
            <div key={scope.id} className={styles.summaryItem}>
              <span className={styles.summaryLabel} style={{ color: scope.color }}>
                {scope.nameRu}
              </span>
              <span className={styles.summaryCount}>{items.length} поз.</span>
              <span className={styles.summaryAmount}>{formatCurrency(subtotal)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface ScopeSectionProps {
  scope: typeof CONSTRUCTION_SCOPES[0];
  items: ExtractedBOQItem[];
  subtotal: number;
  isEditing: boolean;
}

function ScopeSection({ scope, items, subtotal, isEditing }: ScopeSectionProps) {
  return (
    <>
      {/* Section header */}
      <tr className={styles.sectionHeader}>
        <td colSpan={6}>
          <span className={styles.sectionTitle} style={{ borderLeftColor: scope.color }}>
            {scope.nameRu}
          </span>
        </td>
      </tr>

      {/* Items */}
      {items.map((item, index) => (
        <tr key={item.id} className={styles.itemRow}>
          <td className={styles.colNumber}>{item.itemNumber || `${index + 1}`}</td>
          <td className={styles.colDescription}>
            {isEditing ? (
              <input
                type="text"
                className={styles.editInput}
                defaultValue={item.description}
              />
            ) : (
              item.description
            )}
          </td>
          <td className={styles.colUnit}>{item.unit}</td>
          <td className={styles.colQty}>
            {isEditing ? (
              <input
                type="number"
                className={styles.editInput}
                defaultValue={item.quantity || ''}
              />
            ) : (
              formatNumber(item.quantity)
            )}
          </td>
          <td className={styles.colRate}>
            {isEditing ? (
              <input
                type="number"
                className={styles.editInput}
                defaultValue={item.rate || ''}
              />
            ) : (
              formatCurrency(item.rate || 0)
            )}
          </td>
          <td className={styles.colAmount}>{formatCurrency(item.amount || 0)}</td>
        </tr>
      ))}

      {/* Section subtotal */}
      <tr className={styles.subtotalRow}>
        <td colSpan={5}>Итого по разделу "{scope.nameRu}":</td>
        <td className={styles.subtotalAmount}>{formatCurrency(subtotal)}</td>
      </tr>
    </>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2
  }).format(value);
}
