import { useState } from 'react';
import { FileUpload } from '../components/ui/FileUpload';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/tables/DataTable';
import { useExcelParser } from '../hooks/useExcelParser';
import type { SheetData } from '../hooks/useExcelParser';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import styles from './Documents.module.css';

export function Documents() {
  const { parseFile, isLoading, error, result } = useExcelParser();
  const [activeSheet, setActiveSheet] = useState<SheetData | null>(null);

  const handleFileSelect = async (file: File) => {
    const res = await parseFile(file);
    if (res && res.sheets.length > 0) {
      setActiveSheet(res.sheets[0]);
    }
  };

  const columns = activeSheet?.columns.map(col => ({
    key: col,
    label: col,
    sortable: true
  })) || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Документы</h1>
        <p className={styles.subtitle}>
          Загрузка и анализ Excel-файлов
        </p>
      </div>

      <Card title="Загрузка файла" subtitle="Поддерживаются форматы .xlsx, .xls, .csv">
        <FileUpload onFileSelect={handleFileSelect} />

        {isLoading && (
          <div className={styles.loading}>
            <Loader2 size={24} className={styles.spinner} />
            <span>Обработка файла...</span>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </Card>

      {result && (
        <>
          <Card>
            <div className={styles.fileInfo}>
              <FileSpreadsheet size={24} className={styles.fileIcon} />
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>{result.fileName}</span>
                <span className={styles.fileMeta}>
                  {result.sheets.length} лист(ов) · {result.totalRows} строк
                </span>
              </div>
            </div>

            {result.sheets.length > 1 && (
              <div className={styles.sheetTabs}>
                {result.sheets.map(sheet => (
                  <Button
                    key={sheet.name}
                    variant={activeSheet?.name === sheet.name ? 'primary' : 'ghost'}
                    size="small"
                    onClick={() => setActiveSheet(sheet)}
                  >
                    {sheet.name}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          {activeSheet && (
            <Card
              title={`Данные листа: ${activeSheet.name}`}
              subtitle={`${activeSheet.data.length} записей`}
            >
              <DataTable
                data={activeSheet.data}
                columns={columns}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
