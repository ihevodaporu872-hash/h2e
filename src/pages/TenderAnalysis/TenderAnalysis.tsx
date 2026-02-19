import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useTender, TenderProvider } from '../../context/TenderContext';
import { WorkflowStepper } from './components/WorkflowStepper';
import { DocumentIngestionPanel } from './components/DocumentIngestionPanel';
import { ScopeCategorizationView } from './components/ScopeCategorizationView';
import { ValidationPanel } from './components/ValidationPanel';
import { BOQOutputTable } from './components/BOQOutputTable';
import type { TenderWorkflowPhase, ExtractedBOQItem, ValidationResult } from '../../types/tender';
import styles from './TenderAnalysis.module.css';

function TenderAnalysisContent() {
  const {
    currentPhase,
    setCurrentPhase,
    canProceedToPhase,
    uploadedDocuments,
    updateDocumentStatus,
    setExtractedItems,
    setValidationResults,
    setIsValidating,
    setIsProcessing,
    setProcessingMessage,
    resetAll
  } = useTender();

  // Simulate document processing and extraction
  const handleStartProcessing = useCallback(async () => {
    setIsProcessing(true);
    setProcessingMessage('Загрузка документов...');

    // Update all pending documents to uploading
    uploadedDocuments.forEach(doc => {
      if (doc.status === 'pending') {
        updateDocumentStatus(doc.id, 'uploading');
      }
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update to parsing
    uploadedDocuments.forEach(doc => {
      updateDocumentStatus(doc.id, 'parsing');
    });

    setProcessingMessage('Извлечение данных...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock extracted items
    const mockItems = generateMockBOQItems();
    setExtractedItems(mockItems);

    // Update documents to extracted
    uploadedDocuments.forEach(doc => {
      updateDocumentStatus(doc.id, 'extracted');
    });

    setIsProcessing(false);
    setProcessingMessage('');
    setCurrentPhase('alignment');
  }, [uploadedDocuments, updateDocumentStatus, setExtractedItems, setIsProcessing, setProcessingMessage, setCurrentPhase]);

  // Run validation
  const handleRunValidation = useCallback(async () => {
    setIsValidating(true);
    setCurrentPhase('analysis');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock validation results
    const validationResults: ValidationResult = {
      crossCheckResults: [
        {
          id: '1',
          type: 'consistency',
          severity: 'warning',
          description: 'Объём бетона в ТЗ (450 м³) не совпадает с BOQ (420 м³)',
          sourceDocument: 'Scope_of_Works.pdf',
          targetDocument: 'Client_BOQ.xlsx',
          affectedItems: ['item-3', 'item-4']
        }
      ],
      anomalies: [
        {
          id: 'a1',
          type: 'unit_mismatch',
          severity: 'high',
          itemId: 'item-5',
          description: 'Арматура указана в м², должно быть тн или кг',
          suggestion: 'Изменить единицу измерения на "тн"',
          expected: 'тн',
          actual: 'м²'
        },
        {
          id: 'a2',
          type: 'quantity_outlier',
          severity: 'medium',
          itemId: 'item-8',
          description: 'Количество кирпича (1,200,000 шт) значительно выше типичных значений',
          suggestion: 'Проверить расчёт количества'
        }
      ],
      hiddenWorks: [
        {
          id: 'h1',
          description: 'Утилизация грунта',
          impliedBy: 'Разработка котлована',
          sourceSection: 'Раздел 2: Земляные работы',
          estimatedScope: 'earthwork',
          confidence: 0.92,
          suggestedItems: [
            { description: 'Вывоз грунта самосвалами', unit: 'м³', quantity: 1500 },
            { description: 'Утилизация грунта на полигоне', unit: 'м³', quantity: 1500 }
          ]
        },
        {
          id: 'h2',
          description: 'Устройство подбетонки',
          impliedBy: 'Бетонные работы фундамента',
          sourceSection: 'Раздел 6: Бетонные работы',
          estimatedScope: 'concrete',
          confidence: 0.87,
          suggestedItems: [
            { description: 'Бетонная подготовка B7.5 толщ. 100мм', unit: 'м³', quantity: 45 }
          ]
        }
      ],
      supplierReadiness: {
        readyForRFQ: false,
        missingFields: [
          { itemId: 'item-12', field: 'specifications', criticality: 'required' },
          { itemId: 'item-15', field: 'quantity', criticality: 'required' }
        ],
        ambiguousDescriptions: [
          { itemId: 'item-7', issue: '"Бетонные работы" — не указан класс бетона и конструкция', suggestion: 'Уточнить: "Бетон B25 W6 F150 стен подвала"' }
        ],
        readinessScore: 72
      },
      overallScore: 68,
      timestamp: new Date()
    };

    setValidationResults(validationResults);
    setIsValidating(false);
  }, [setIsValidating, setCurrentPhase, setValidationResults]);

  // Proceed to BOQ output
  const handleGenerateBOQ = useCallback(() => {
    setCurrentPhase('output');
  }, [setCurrentPhase]);

  const handlePhaseClick = (phase: TenderWorkflowPhase) => {
    if (canProceedToPhase(phase)) {
      setCurrentPhase(phase);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1>Анализ тендерной документации</h1>
          <p>Загрузите документы, классифицируйте работы и сформируйте BOQ</p>
        </div>
        <Button
          variant="ghost"
          icon={<RotateCcw size={16} />}
          onClick={resetAll}
        >
          Начать заново
        </Button>
      </header>

      <WorkflowStepper
        currentPhase={currentPhase}
        onPhaseClick={handlePhaseClick}
        canNavigateTo={canProceedToPhase}
      />

      <main className={styles.content}>
        {currentPhase === 'ingestion' && (
          <DocumentIngestionPanel onStartProcessing={handleStartProcessing} />
        )}

        {currentPhase === 'alignment' && (
          <ScopeCategorizationView onProceed={handleRunValidation} />
        )}

        {currentPhase === 'analysis' && (
          <ValidationPanel onProceed={handleGenerateBOQ} />
        )}

        {currentPhase === 'output' && (
          <BOQOutputTable />
        )}
      </main>
    </div>
  );
}

// Wrapper with provider
export function TenderAnalysis() {
  return (
    <TenderProvider>
      <TenderAnalysisContent />
    </TenderProvider>
  );
}

// Generate mock BOQ items for demo
function generateMockBOQItems(): ExtractedBOQItem[] {
  const items: ExtractedBOQItem[] = [
    // ВЗиС
    { id: 'item-1', itemNumber: '1.1', description: 'Ограждение строительной площадки', unit: 'м.п.', quantity: 450, rate: 2500, amount: 1125000, scope: 'vzis', confidence: 0.95, sourceDocument: 'Scope_of_Works.pdf', validationFlags: [] },
    { id: 'item-2', itemNumber: '1.2', description: 'Устройство временных дорог', unit: 'м²', quantity: 800, rate: 1800, amount: 1440000, scope: 'vzis', confidence: 0.91, sourceDocument: 'Scope_of_Works.pdf', validationFlags: [] },

    // Земляные работы
    { id: 'item-3', itemNumber: '2.1', description: 'Разработка грунта экскаватором', unit: 'м³', quantity: 4500, rate: 450, amount: 2025000, scope: 'earthwork', confidence: 0.97, sourceDocument: 'Client_BOQ.xlsx', validationFlags: [] },
    { id: 'item-4', itemNumber: '2.2', description: 'Обратная засыпка с уплотнением', unit: 'м³', quantity: 1200, rate: 380, amount: 456000, scope: 'earthwork', confidence: 0.94, sourceDocument: 'Client_BOQ.xlsx', validationFlags: [] },

    // Бетонные работы
    { id: 'item-5', itemNumber: '3.1', description: 'Бетон B25 W6 фундаментной плиты', unit: 'м³', quantity: 420, rate: 8500, amount: 3570000, scope: 'concrete', confidence: 0.98, sourceDocument: 'Client_BOQ.xlsx', validationFlags: [] },
    { id: 'item-6', itemNumber: '3.2', description: 'Устройство опалубки стен', unit: 'м²', quantity: 2800, rate: 650, amount: 1820000, scope: 'concrete', confidence: 0.93, sourceDocument: 'Client_BOQ.xlsx', validationFlags: [] },
    { id: 'item-7', itemNumber: '3.3', description: 'Бетонирование стен подвала', unit: 'м³', quantity: 380, rate: 9200, amount: 3496000, scope: 'concrete', confidence: 0.89, sourceDocument: 'Tech_Report.pdf', validationFlags: [{ type: 'readiness', severity: 'warning', message: 'Требуется уточнение класса бетона' }] },

    // Армирование
    { id: 'item-8', itemNumber: '4.1', description: 'Арматура А500С фундамента', unit: 'тн', quantity: 85, rate: 95000, amount: 8075000, scope: 'reinforcement', confidence: 0.96, sourceDocument: 'Client_BOQ.xlsx', validationFlags: [] },
    { id: 'item-9', itemNumber: '4.2', description: 'Арматурные сетки', unit: 'тн', quantity: 12, rate: 98000, amount: 1176000, scope: 'reinforcement', confidence: 0.88, sourceDocument: 'Client_BOQ.xlsx', validationFlags: [] },

    // Каменные работы
    { id: 'item-10', itemNumber: '5.1', description: 'Кладка наружных стен из газобетона', unit: 'м³', quantity: 650, rate: 4200, amount: 2730000, scope: 'masonry', confidence: 0.94, sourceDocument: 'Scope_of_Works.pdf', validationFlags: [] },
    { id: 'item-11', itemNumber: '5.2', description: 'Кладка перегородок из кирпича', unit: 'м²', quantity: 1800, rate: 1200, amount: 2160000, scope: 'masonry', confidence: 0.91, sourceDocument: 'Scope_of_Works.pdf', validationFlags: [] },

    // Гидроизоляция
    { id: 'item-12', itemNumber: '6.1', description: 'Гидроизоляция фундамента обмазочная', unit: 'м²', quantity: 1200, rate: 450, amount: 540000, scope: 'waterproofing', confidence: 0.92, sourceDocument: 'Tech_Report.pdf', validationFlags: [] },

    // Кровля
    { id: 'item-13', itemNumber: '7.1', description: 'Устройство плоской кровли с мембраной', unit: 'м²', quantity: 2200, rate: 2800, amount: 6160000, scope: 'roofing', confidence: 0.95, sourceDocument: 'Scope_of_Works.pdf', validationFlags: [] },

    // Отделка
    { id: 'item-14', itemNumber: '8.1', description: 'Штукатурка стен механизированная', unit: 'м²', quantity: 8500, rate: 380, amount: 3230000, scope: 'finishes', confidence: 0.90, sourceDocument: 'Scope_of_Works.pdf', validationFlags: [] },
    { id: 'item-15', itemNumber: '8.2', description: 'Устройство наливных полов', unit: 'м²', quantity: 3200, rate: 650, amount: 2080000, scope: 'finishes', confidence: 0.87, sourceDocument: 'Scope_of_Works.pdf', validationFlags: [] },
  ];

  return items;
}
