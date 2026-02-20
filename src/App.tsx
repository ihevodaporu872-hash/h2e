import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

type Theme = 'light' | 'dark';

// 13 Standard Scopes (Общестрой)
const SCOPES = [
  { id: 1, name: 'Временные здания и сооружения', nameEn: 'Temporary Buildings' },
  { id: 2, name: 'Земляные работы', nameEn: 'Earthworks' },
  { id: 3, name: 'Ограждение котлована', nameEn: 'Pit Enclosure' },
  { id: 4, name: 'Водопонижение', nameEn: 'Dewatering' },
  { id: 5, name: 'Свайные работы', nameEn: 'Piling Works' },
  { id: 6, name: 'Распорная Система', nameEn: 'Strut System' },
  { id: 7, name: 'Гидроизоляция', nameEn: 'Waterproofing' },
  { id: 8, name: 'Монолитные работы', nameEn: 'Monolithic Works' },
  { id: 9, name: 'Кладочные работы', nameEn: 'Masonry Works' },
  { id: 10, name: 'Двери, люки и ворота', nameEn: 'Doors & Gates' },
  { id: 11, name: 'Кровельные работы', nameEn: 'Roofing Works' },
  { id: 12, name: 'Металлические конструкции', nameEn: 'Metal Structures' },
  { id: 13, name: 'Технологические решение', nameEn: 'Technical Solutions' },
];

type WorkflowStep = 'upload' | 'analyze' | 'review' | 'export';

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface ParsedSheet {
  name: string;
  data: (string | number | null)[][];
  headers: string[];
}

interface ParsedFile {
  fileName: string;
  sheets: ParsedSheet[];
}

function App() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<{ fileIndex: number; sheetIndex: number } | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const steps: { id: WorkflowStep; label: string; icon: string }[] = [
    { id: 'upload', label: 'Загрузка', icon: '📤' },
    { id: 'analyze', label: 'Анализ', icon: '🔍' },
    { id: 'review', label: 'Проверка', icon: '✅' },
    { id: 'export', label: 'BOQ', icon: '📋' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const parseExcelFile = async (file: File): Promise<ParsedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          const sheets: ParsedSheet[] = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
              header: 1,
              defval: null
            });

            // Get headers from first row
            const headers = jsonData[0]?.map(h => String(h || '')) || [];

            return {
              name: sheetName,
              data: jsonData,
              headers
            };
          });

          resolve({
            fileName: file.name,
            sheets
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const processFiles = async (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setFiles(prev => [...prev, ...newFiles]);

    // Parse Excel files
    const excelFiles = fileList.filter(f => f.name.match(/\.xlsx?$/i));
    if (excelFiles.length > 0) {
      setIsProcessing(true);
      try {
        const parsed = await Promise.all(excelFiles.map(parseExcelFile));
        setParsedFiles(prev => [...prev, ...parsed]);
      } catch (error) {
        console.error('Error parsing Excel files:', error);
      }
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles(prev => prev.filter((_, i) => i !== index));
    setParsedFiles(prev => prev.filter(p => p.fileName !== fileToRemove.name));
  };

  const resetAll = () => {
    setFiles([]);
    setParsedFiles([]);
    setSelectedSheet(null);
    setCurrentStep('upload');
  };

  const getTotalRows = () => {
    return parsedFiles.reduce((total, file) =>
      total + file.sheets.reduce((sheetTotal, sheet) => sheetTotal + sheet.data.length, 0), 0
    );
  };

  const getTotalSheets = () => {
    return parsedFiles.reduce((total, file) => total + file.sheets.length, 0);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🏗️</span>
            <div>
              <h1>Lead Tender Engineer & AI Estimator</h1>
              <p>Анализ тендерной документации • 13 разделов (Общестрой)</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="theme-btn" onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="reset-btn" onClick={resetAll}>
              ↻ Сброс
            </button>
          </div>
        </div>
      </header>

      {/* Workflow Steps */}
      <nav className="workflow">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`workflow-step ${currentStep === step.id ? 'active' : ''} ${
              steps.findIndex(s => s.id === currentStep) > index ? 'completed' : ''
            }`}
            onClick={() => setCurrentStep(step.id)}
          >
            <span className="step-icon">{step.icon}</span>
            <span className="step-label">ШАГ {index + 1}</span>
            <span className="step-name">{step.label}</span>
          </div>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main">
        {currentStep === 'upload' && (
          <section className="upload-section">
            {/* Upload Area */}
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-icon">📁</div>
              <h3>Перетащите файлы сюда</h3>
              <p>или нажмите для выбора</p>
              <p className="file-types">PDF, Excel (XLSX, XLS), Word (DOCX, DOC)</p>
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.docx,.doc"
                onChange={handleFileInput}
                className="file-input"
              />
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="processing-indicator">
                <span className="spinner">⏳</span>
                <span>Обработка файлов...</span>
              </div>
            )}

            {/* Uploaded Files */}
            {files.length > 0 && (
              <div className="files-list">
                <h4>Загруженные файлы ({files.length})</h4>
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-icon">
                      {file.name.endsWith('.pdf') ? '📄' :
                       file.name.match(/\.xlsx?$/) ? '📊' : '📝'}
                    </span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <button className="remove-file" onClick={() => removeFile(index)}>✕</button>
                  </div>
                ))}

                {/* Parsed data summary */}
                {parsedFiles.length > 0 && (
                  <div className="parsed-summary">
                    <span>✓ Распознано: {getTotalSheets()} листов, {getTotalRows()} строк</span>
                  </div>
                )}

                <button
                  className="analyze-btn"
                  onClick={() => setCurrentStep('analyze')}
                  disabled={isProcessing}
                >
                  Начать анализ →
                </button>
              </div>
            )}
          </section>
        )}

        {currentStep === 'analyze' && (
          <section className="analyze-section">
            <h2>Классификация по разделам</h2>
            <p className="section-desc">13 обязательных разделов (Московский стандарт)</p>

            {/* Parsed Data Preview */}
            {parsedFiles.length > 0 && (
              <div className="parsed-data-section">
                <h3>📊 Загруженные данные</h3>

                {/* Sheet selector */}
                <div className="sheet-tabs">
                  {parsedFiles.map((file, fileIndex) => (
                    file.sheets.map((sheet, sheetIndex) => (
                      <button
                        key={`${fileIndex}-${sheetIndex}`}
                        className={`sheet-tab ${selectedSheet?.fileIndex === fileIndex && selectedSheet?.sheetIndex === sheetIndex ? 'active' : ''}`}
                        onClick={() => setSelectedSheet({ fileIndex, sheetIndex })}
                      >
                        {sheet.name}
                        <span className="row-count">({sheet.data.length} строк)</span>
                      </button>
                    ))
                  ))}
                </div>

                {/* Data preview */}
                {selectedSheet && parsedFiles[selectedSheet.fileIndex] && (
                  <div className="data-preview">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          {parsedFiles[selectedSheet.fileIndex].sheets[selectedSheet.sheetIndex].headers.slice(0, 8).map((header, i) => (
                            <th key={i}>{header || `Колонка ${i + 1}`}</th>
                          ))}
                          {parsedFiles[selectedSheet.fileIndex].sheets[selectedSheet.sheetIndex].headers.length > 8 && (
                            <th>...</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedFiles[selectedSheet.fileIndex].sheets[selectedSheet.sheetIndex].data.slice(1, 11).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.slice(0, 8).map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell !== null ? String(cell) : ''}</td>
                            ))}
                            {row.length > 8 && <td>...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedFiles[selectedSheet.fileIndex].sheets[selectedSheet.sheetIndex].data.length > 11 && (
                      <p className="preview-note">
                        Показано 10 из {parsedFiles[selectedSheet.fileIndex].sheets[selectedSheet.sheetIndex].data.length - 1} строк
                      </p>
                    )}
                  </div>
                )}

                {!selectedSheet && parsedFiles.length > 0 && (
                  <p className="select-sheet-hint">Выберите лист для просмотра данных</p>
                )}
              </div>
            )}

            <div className="scopes-grid">
              {SCOPES.map(scope => (
                <div key={scope.id} className="scope-card">
                  <span className="scope-number">{scope.id}</span>
                  <div className="scope-info">
                    <h4>{scope.name}</h4>
                    <p>{scope.nameEn}</p>
                  </div>
                  <span className="scope-status pending">⏳</span>
                </div>
              ))}
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => setCurrentStep('upload')}>
                ← Назад
              </button>
              <button className="btn-primary" onClick={() => setCurrentStep('review')}>
                Проверка →
              </button>
            </div>
          </section>
        )}

        {currentStep === 'review' && (
          <section className="review-section">
            <h2>Проверка и валидация</h2>

            <div className="validation-card">
              <h3>🔍 Deep Thinking Protocol</h3>
              <div className="validation-checks">
                <div className="check-item">
                  <span className="check-icon">☐</span>
                  <span>Contract vs. Design Cross-Check (ДГП vs ПД)</span>
                </div>
                <div className="check-item">
                  <span className="check-icon">☐</span>
                  <span>Implied Works (утилизация, опалубка, арматура)</span>
                </div>
                <div className="check-item">
                  <span className="check-icon">☐</span>
                  <span>Unit Validation (m², m³, tons)</span>
                </div>
                <div className="check-item">
                  <span className="check-icon">☐</span>
                  <span>Supplier Readiness Check</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => setCurrentStep('analyze')}>
                ← Назад
              </button>
              <button className="btn-primary" onClick={() => setCurrentStep('export')}>
                Сформировать BOQ →
              </button>
            </div>
          </section>
        )}

        {currentStep === 'export' && (
          <section className="export-section">
            <h2>BOQ / RFQ</h2>
            <p className="section-desc">Готово к отправке поставщикам</p>

            <div className="export-preview">
              <table className="boq-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Раздел</th>
                    <th>Описание работ</th>
                    <th>Ед.</th>
                    <th>Кол-во</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Земляные работы</td>
                    <td>Разработка грунта экскаватором</td>
                    <td>м³</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Свайные работы</td>
                    <td>Устройство буронабивных свай</td>
                    <td>шт</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="export-actions">
              <button className="btn-export">📥 Скачать Excel</button>
              <button className="btn-export">📄 Скачать PDF</button>
            </div>

            <div className="action-buttons">
              <button className="btn-secondary" onClick={() => setCurrentStep('review')}>
                ← Назад
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
