import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export function FileUpload({
  onFileSelect,
  accept = '.xlsx,.xls,.csv',
  maxSize = 10 * 1024 * 1024
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    if (file.size > maxSize) {
      setError(`Файл слишком большой. Максимум: ${Math.round(maxSize / 1024 / 1024)} МБ`);
      return;
    }

    const validExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setError('Неподдерживаемый формат файла');
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [accept, maxSize, onFileSelect]);

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
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.active : ''} ${error ? styles.error : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className={styles.input}
          id="file-upload"
        />

        {selectedFile ? (
          <div className={styles.fileInfo}>
            <FileSpreadsheet size={40} className={styles.fileIcon} />
            <div className={styles.fileDetails}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>
                {(selectedFile.size / 1024).toFixed(1)} КБ
              </span>
            </div>
            <button onClick={clearFile} className={styles.clearButton}>
              <X size={20} />
            </button>
          </div>
        ) : (
          <label htmlFor="file-upload" className={styles.label}>
            <Upload size={40} className={styles.uploadIcon} />
            <span className={styles.text}>
              Перетащите файл сюда или <span className={styles.link}>выберите</span>
            </span>
            <span className={styles.hint}>
              Поддерживаемые форматы: Excel (.xlsx, .xls), CSV
            </span>
          </label>
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
