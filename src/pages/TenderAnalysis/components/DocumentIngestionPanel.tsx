import { useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle, AlertCircle, Play, Zap } from 'lucide-react';
import { FileUpload } from '../../../components/ui/FileUpload';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useTender } from '../../../context/TenderContext';
import { DOCUMENT_TYPE_LABELS } from '../../../constants/scopes';
import type { TenderDocument, TenderDocumentType, DocumentProcessingStatus } from '../../../types/tender';
import styles from './DocumentIngestionPanel.module.css';

interface DocumentIngestionPanelProps {
  onStartProcessing: () => void;
  onStartDemo: () => void;
}

export function DocumentIngestionPanel({ onStartProcessing, onStartDemo }: DocumentIngestionPanelProps) {
  const { uploadedDocuments, addDocument, removeDocument, updateDocumentStatus, isProcessing } = useTender();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles(files);
  };

  const handleAddToQueue = () => {
    pendingFiles.forEach(file => {
      const doc: TenderDocument = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type: detectDocumentType(file.name),
        status: 'pending',
        size: file.size,
        uploadedAt: new Date()
      };
      addDocument(doc);
    });
    setPendingFiles([]);
  };

  const handleTypeChange = (docId: string, _newType: TenderDocumentType) => {
    updateDocumentStatus(docId, 'pending');
  };

  const canProcess = uploadedDocuments.length > 0 &&
    uploadedDocuments.every(d => d.status !== 'uploading' && d.status !== 'parsing');

  return (
    <div className={styles.panel}>
      {/* Demo Mode Card */}
      <Card>
        <div className={styles.demoCard}>
          <div className={styles.demoInfo}>
            <Zap size={32} className={styles.demoIcon} />
            <div>
              <h3>Демо-режим</h3>
              <p>Посмотрите работу системы на примере реального тендера без загрузки файлов</p>
            </div>
          </div>
          <Button
            onClick={onStartDemo}
            icon={<Play size={16} />}
            disabled={isProcessing}
          >
            Запустить демо
          </Button>
        </div>
      </Card>

      {/* Divider */}
      <div className={styles.divider}>
        <span>или загрузите свои документы</span>
      </div>

      {/* File Upload Card */}
      <Card title="Загрузка документов" subtitle="Тендерная документация (PDF, Excel, Word)">
        <div className={styles.content}>
          <FileUpload
            onFileSelect={handleFilesSelected}
            accept=".xlsx,.xls,.pdf,.docx,.doc"
            multiple={true}
            label="Перетащите файлы сюда"
            hint="BOQ Заказчика, ТЗ, Технический отчёт"
          />

          {pendingFiles.length > 0 && (
            <div className={styles.pendingActions}>
              <span className={styles.pendingCount}>
                Выбрано файлов: {pendingFiles.length}
              </span>
              <Button onClick={handleAddToQueue} icon={<Upload size={16} />}>
                Добавить в очередь
              </Button>
            </div>
          )}
        </div>
      </Card>

      {uploadedDocuments.length > 0 && (
        <Card title="Очередь документов" subtitle={`${uploadedDocuments.length} документ(ов)`}>
          <div className={styles.documentList}>
            {uploadedDocuments.map(doc => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onRemove={() => removeDocument(doc.id)}
                onTypeChange={(type) => handleTypeChange(doc.id, type)}
              />
            ))}
          </div>

          <div className={styles.processActions}>
            <Button
              onClick={onStartProcessing}
              disabled={!canProcess || isProcessing}
              icon={isProcessing ? <Loader2 size={16} className={styles.spinner} /> : undefined}
              size="large"
              fullWidth
            >
              {isProcessing ? 'Обработка...' : 'Начать анализ документов'}
            </Button>
          </div>
        </Card>
      )}

      {/* Info about 13 scopes */}
      <Card title="13 обязательных разделов (Московский стандарт)">
        <div className={styles.scopesList}>
          <div className={styles.scopeItem}>1. ВЗиС</div>
          <div className={styles.scopeItem}>2. Земляные работы</div>
          <div className={styles.scopeItem}>3. Ограждение котлована</div>
          <div className={styles.scopeItem}>4. Водопонижение</div>
          <div className={styles.scopeItem}>5. Свайные работы</div>
          <div className={styles.scopeItem}>6. Монолит (Ниже 0)</div>
          <div className={styles.scopeItem}>7. Монолит (Выше 0)</div>
          <div className={styles.scopeItem}>8. Гидроизоляция/Утепление</div>
          <div className={styles.scopeItem}>9. Кладка/Перегородки</div>
          <div className={styles.scopeItem}>10. Кровля</div>
          <div className={styles.scopeItem}>11. Фасад</div>
          <div className={styles.scopeItem}>12. Окна/Витражи</div>
          <div className={styles.scopeItem}>13. Благоустройство</div>
        </div>
      </Card>
    </div>
  );
}

interface DocumentRowProps {
  document: TenderDocument;
  onRemove: () => void;
  onTypeChange: (type: TenderDocumentType) => void;
}

function DocumentRow({ document, onRemove, onTypeChange }: DocumentRowProps) {
  return (
    <div className={styles.documentRow}>
      <div className={styles.documentIcon}>
        <FileText size={20} />
      </div>

      <div className={styles.documentInfo}>
        <span className={styles.documentName}>{document.name}</span>
        <span className={styles.documentSize}>{formatFileSize(document.size)}</span>
      </div>

      <select
        className={styles.typeSelect}
        value={document.type}
        onChange={(e) => onTypeChange(e.target.value as TenderDocumentType)}
      >
        {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <div className={styles.documentStatus}>
        <StatusBadge status={document.status} />
      </div>

      <button onClick={onRemove} className={styles.removeBtn}>
        ×
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: DocumentProcessingStatus }) {
  const config = {
    pending: { icon: null, label: 'Ожидание', className: styles.statusPending },
    uploading: { icon: Loader2, label: 'Загрузка', className: styles.statusUploading },
    parsing: { icon: Loader2, label: 'Парсинг', className: styles.statusParsing },
    extracted: { icon: CheckCircle, label: 'Извлечено', className: styles.statusExtracted },
    categorized: { icon: CheckCircle, label: 'Готово', className: styles.statusCategorized },
    error: { icon: AlertCircle, label: 'Ошибка', className: styles.statusError }
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span className={`${styles.statusBadge} ${className}`}>
      {Icon && <Icon size={14} className={status === 'uploading' || status === 'parsing' ? styles.spinner : ''} />}
      {label}
    </span>
  );
}

function detectDocumentType(fileName: string): TenderDocumentType {
  const lower = fileName.toLowerCase();
  if (lower.includes('scope') || lower.includes('sow') || lower.includes('тз')) return 'scope_of_works';
  if (lower.includes('technical') || lower.includes('tech') || lower.includes('отчёт') || lower.includes('пз')) return 'technical_report';
  if (lower.includes('boq') || lower.includes('боq') || lower.includes('ведомость')) return 'client_boq';
  if (lower.includes('spec') || lower.includes('спец')) return 'specifications';
  if (lower.includes('drawing') || lower.includes('чертеж')) return 'drawings_list';
  return 'other';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
