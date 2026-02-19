import { useState, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  X,
  Zap
} from 'lucide-react';
import styles from './BOQExtract.module.css';

interface ExtractedItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number | null;
  rate: number | null;
  amount: number | null;
  section: string;
  confidence: number;
}

interface ExtractionResult {
  items: ExtractedItem[];
  sections: { name: string; count: number; subtotal: number }[];
  totalItems: number;
  grandTotal: number;
  processingTime: number;
}

type ExtractionStatus = 'idle' | 'uploading' | 'parsing' | 'extracting' | 'complete' | 'error';

// Mock data for demo
const mockExtractionResult: ExtractionResult = {
  items: [
    { id: '1', itemNumber: '1.1', description: 'Мобилизация и демобилизация оборудования', unit: 'комплект', quantity: 1, rate: 150000, amount: 150000, section: 'Подготовительные работы', confidence: 0.95 },
    { id: '2', itemNumber: '1.2', description: 'Временные сооружения и ограждения', unit: 'м.п.', quantity: 250, rate: 1200, amount: 300000, section: 'Подготовительные работы', confidence: 0.92 },
    { id: '3', itemNumber: '2.1', description: 'Разработка грунта экскаватором', unit: 'м³', quantity: 1500, rate: 450, amount: 675000, section: 'Земляные работы', confidence: 0.98 },
    { id: '4', itemNumber: '2.2', description: 'Обратная засыпка с уплотнением', unit: 'м³', quantity: 800, rate: 380, amount: 304000, section: 'Земляные работы', confidence: 0.94 },
    { id: '5', itemNumber: '3.1', description: 'Бетон фундаментов класса B25', unit: 'м³', quantity: 450, rate: 8500, amount: 3825000, section: 'Бетонные работы', confidence: 0.97 },
    { id: '6', itemNumber: '3.2', description: 'Арматура А500С', unit: 'т', quantity: 85, rate: 95000, amount: 8075000, section: 'Бетонные работы', confidence: 0.96 },
    { id: '7', itemNumber: '4.1', description: 'Кирпичная кладка несущих стен', unit: 'м³', quantity: 320, rate: 12500, amount: 4000000, section: 'Каменные работы', confidence: 0.91 },
    { id: '8', itemNumber: '5.1', description: 'Монтаж металлоконструкций', unit: 'т', quantity: 120, rate: 45000, amount: 5400000, section: 'Металлоконструкции', confidence: 0.93 },
  ],
  sections: [
    { name: 'Подготовительные работы', count: 2, subtotal: 450000 },
    { name: 'Земляные работы', count: 2, subtotal: 979000 },
    { name: 'Бетонные работы', count: 2, subtotal: 11900000 },
    { name: 'Каменные работы', count: 1, subtotal: 4000000 },
    { name: 'Металлоконструкции', count: 1, subtotal: 5400000 },
  ],
  totalItems: 8,
  grandTotal: 22729000,
  processingTime: 12.5,
};

const statusMessages: Record<ExtractionStatus, string> = {
  idle: 'Готов к работе',
  uploading: 'Загрузка файла...',
  parsing: 'Извлечение текста из документа...',
  extracting: 'AI анализирует содержимое...',
  complete: 'Извлечение завершено',
  error: 'Ошибка при обработке',
};

export function BOQExtract() {
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const validExtensions = ['.pdf', '.docx', '.xlsx', '.xls', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError('Неподдерживаемый формат. Используйте PDF, DOCX, XLSX или изображения.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Файл слишком большой. Максимум 50 МБ.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    setResult(null);
    setStatus('idle');
  };

  const startExtraction = async () => {
    if (!selectedFile) return;

    setError(null);

    // Simulate extraction process
    setStatus('uploading');
    await new Promise(r => setTimeout(r, 800));

    setStatus('parsing');
    await new Promise(r => setTimeout(r, 1500));

    setStatus('extracting');
    await new Promise(r => setTimeout(r, 2500));

    // Set mock result
    setResult(mockExtractionResult);
    setStatus('complete');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.9) return styles.confidenceHigh;
    if (confidence >= 0.7) return styles.confidenceMedium;
    return styles.confidenceLow;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Sparkles className={styles.titleIcon} size={28} />
            AI Извлечение BOQ
          </h1>
          <p className={styles.subtitle}>
            Автоматическое извлечение ведомости объёмов из тендерной документации
          </p>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Upload Section */}
        <Card title="Загрузка документа" subtitle="PDF, Word, Excel или изображения">
          <div
            className={`${styles.dropzone} ${dragActive ? styles.active : ''} ${selectedFile ? styles.hasFile : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
              onChange={handleChange}
              className={styles.input}
              id="boq-file-upload"
            />

            {selectedFile ? (
              <div className={styles.fileInfo}>
                <FileSpreadsheet size={48} className={styles.fileIcon} />
                <div className={styles.fileDetails}>
                  <span className={styles.fileName}>{selectedFile.name}</span>
                  <span className={styles.fileSize}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                  </span>
                </div>
                <button onClick={clearFile} className={styles.clearButton} disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}>
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label htmlFor="boq-file-upload" className={styles.label}>
                <Upload size={48} className={styles.uploadIcon} />
                <span className={styles.text}>
                  Перетащите файл или <span className={styles.link}>выберите</span>
                </span>
                <span className={styles.hint}>
                  PDF, DOCX, XLSX, PNG, JPG (до 50 МБ)
                </span>
              </label>
            )}
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Status indicator */}
          {status !== 'idle' && (
            <div className={`${styles.statusBar} ${styles[status]}`}>
              {status === 'complete' ? (
                <CheckCircle size={18} />
              ) : status === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <Loader2 size={18} className={styles.spinner} />
              )}
              <span>{statusMessages[status]}</span>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              onClick={startExtraction}
              disabled={!selectedFile || (status !== 'idle' && status !== 'complete' && status !== 'error')}
              icon={status === 'extracting' ? <Loader2 size={18} className={styles.spinner} /> : <Zap size={18} />}
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? 'Извлечь BOQ' : 'Обработка...'}
            </Button>
          </div>
        </Card>

        {/* Features Card */}
        <Card title="Возможности" subtitle="Что умеет AI-экстрактор">
          <div className={styles.featuresList}>
            <div className={styles.feature}>
              <FileText size={20} className={styles.featureIcon} />
              <div>
                <h4>Множество форматов</h4>
                <p>PDF, Word, Excel, сканы и фото документов</p>
              </div>
            </div>
            <div className={styles.feature}>
              <Sparkles size={20} className={styles.featureIcon} />
              <div>
                <h4>Умное извлечение</h4>
                <p>GPT-4o понимает контекст и структуру BOQ</p>
              </div>
            </div>
            <div className={styles.feature}>
              <CheckCircle size={20} className={styles.featureIcon} />
              <div>
                <h4>Автоклассификация</h4>
                <p>Группировка по разделам СМР</p>
              </div>
            </div>
            <div className={styles.feature}>
              <Download size={20} className={styles.featureIcon} />
              <div>
                <h4>Экспорт в Excel</h4>
                <p>Готовый BOQ с формулами и итогами</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Section */}
      {result && (
        <div className={styles.resultsSection}>
          {/* Summary Cards */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{result.totalItems}</span>
              <span className={styles.summaryLabel}>Позиций извлечено</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{result.sections.length}</span>
              <span className={styles.summaryLabel}>Разделов</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{result.processingTime}с</span>
              <span className={styles.summaryLabel}>Время обработки</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.total}`}>
              <span className={styles.summaryValue}>{formatCurrency(result.grandTotal)}</span>
              <span className={styles.summaryLabel}>Итого</span>
            </div>
          </div>

          {/* Sections Overview */}
          <Card title="Разделы BOQ" subtitle="Распределение по видам работ">
            <div className={styles.sectionsGrid}>
              {result.sections.map((section, i) => (
                <div key={i} className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionName}>{section.name}</span>
                    <span className={styles.sectionCount}>{section.count} поз.</span>
                  </div>
                  <span className={styles.sectionTotal}>{formatCurrency(section.subtotal)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Extracted Items Table */}
          <Card
            title="Извлечённые позиции"
            subtitle={`${result.items.length} позиций`}
          >
            <div className={styles.tableActions}>
              <Button variant="outline" icon={<Download size={18} />}>
                Скачать Excel
              </Button>
            </div>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>№</span>
                <span>Наименование</span>
                <span>Ед.</span>
                <span>Кол-во</span>
                <span>Цена</span>
                <span>Сумма</span>
                <span>Точность</span>
              </div>
              {result.items.map((item) => (
                <div key={item.id} className={styles.tableRow}>
                  <span className={styles.itemNumber}>{item.itemNumber}</span>
                  <span className={styles.description}>
                    <span className={styles.descText}>{item.description}</span>
                    <span className={styles.section}>{item.section}</span>
                  </span>
                  <span>{item.unit}</span>
                  <span>{item.quantity?.toLocaleString('ru-RU') ?? '-'}</span>
                  <span>{item.rate?.toLocaleString('ru-RU') ?? '-'}</span>
                  <span className={styles.amount}>
                    {item.amount ? formatCurrency(item.amount) : '-'}
                  </span>
                  <span className={`${styles.confidence} ${getConfidenceClass(item.confidence)}`}>
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
