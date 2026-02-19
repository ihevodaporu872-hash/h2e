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

  // Demo mode - skip file upload
  const handleStartDemo = useCallback(async () => {
    setIsProcessing(true);
    setProcessingMessage('Загрузка демо-данных...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    setProcessingMessage('Извлечение позиций из документов...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockItems = generateMockBOQItems();
    setExtractedItems(mockItems);

    setIsProcessing(false);
    setProcessingMessage('');
    setCurrentPhase('alignment');
  }, [setExtractedItems, setIsProcessing, setProcessingMessage, setCurrentPhase]);

  // Process uploaded documents
  const handleStartProcessing = useCallback(async () => {
    setIsProcessing(true);
    setProcessingMessage('Загрузка документов...');

    uploadedDocuments.forEach(doc => {
      if (doc.status === 'pending') {
        updateDocumentStatus(doc.id, 'uploading');
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    uploadedDocuments.forEach(doc => {
      updateDocumentStatus(doc.id, 'parsing');
    });

    setProcessingMessage('Извлечение данных...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockItems = generateMockBOQItems();
    setExtractedItems(mockItems);

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

    const validationResults: ValidationResult = {
      crossCheckResults: [
        {
          id: '1',
          type: 'consistency',
          severity: 'warning',
          description: 'Объём бетона в ТЗ (450 м³) не совпадает с BOQ (420 м³)',
          sourceDocument: 'ТЗ_Жилой_дом.pdf',
          targetDocument: 'BOQ_Клиента.xlsx',
          affectedItems: ['item-6', 'item-7']
        },
        {
          id: '2',
          type: 'coverage',
          severity: 'info',
          description: 'В ТЗ указан двойной слой утеплителя, в BOQ — одинарный',
          sourceDocument: 'ТЗ_Жилой_дом.pdf',
          targetDocument: 'BOQ_Клиента.xlsx',
          affectedItems: ['item-11']
        }
      ],
      anomalies: [
        {
          id: 'a1',
          type: 'unit_mismatch',
          severity: 'high',
          itemId: 'item-8',
          description: 'Арматура указана в м², должно быть тн',
          suggestion: 'Изменить единицу измерения на "тн"',
          expected: 'тн',
          actual: 'м²'
        },
        {
          id: 'a2',
          type: 'quantity_outlier',
          severity: 'medium',
          itemId: 'item-12',
          description: 'Площадь кладки (12,000 м²) превышает типичные значения',
          suggestion: 'Проверить расчёт — возможно включены перегородки'
        }
      ],
      hiddenWorks: [
        {
          id: 'h1',
          description: 'Утилизация грунта',
          impliedBy: 'Разработка котлована с вывозом',
          sourceSection: 'Раздел 2: Земляные работы',
          estimatedScope: 'earthwork',
          confidence: 0.95,
          suggestedItems: [
            { description: 'Вывоз грунта самосвалами (10% коэфф. разрыхления)', unit: 'м³', quantity: 4950 },
            { description: 'Утилизация грунта на полигоне', unit: 'м³', quantity: 4950 }
          ]
        },
        {
          id: 'h2',
          description: 'Уборка снега в зимний период',
          impliedBy: 'Работы круглогодичные',
          sourceSection: 'Общие условия контракта',
          estimatedScope: 'vzis',
          confidence: 0.88,
          suggestedItems: [
            { description: 'Механизированная уборка снега', unit: 'м²', quantity: 5000 }
          ]
        },
        {
          id: 'h3',
          description: 'Снос существующих фундаментов',
          impliedBy: 'Технический отчёт изысканий',
          sourceSection: 'Раздел 1.3: Существующие сооружения',
          estimatedScope: 'earthwork',
          confidence: 0.82,
          suggestedItems: [
            { description: 'Демонтаж ж/б конструкций', unit: 'м³', quantity: 120 }
          ]
        }
      ],
      supplierReadiness: {
        readyForRFQ: false,
        missingFields: [
          { itemId: 'item-14', field: 'specifications', criticality: 'required' },
          { itemId: 'item-18', field: 'quantity', criticality: 'required' }
        ],
        ambiguousDescriptions: [
          { itemId: 'item-7', issue: '"Монолит стен" — не указан класс бетона', suggestion: 'Уточнить: "Бетон B25 W6 F150 стен подвала"' },
          { itemId: 'item-15', issue: '"Витражи" — не указаны размеры и тип профиля', suggestion: 'Добавить спецификацию из раздела АР' }
        ],
        readinessScore: 68
      },
      overallScore: 72,
      timestamp: new Date()
    };

    setValidationResults(validationResults);
    setIsValidating(false);
  }, [setIsValidating, setCurrentPhase, setValidationResults]);

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
          <h1>Lead Tender Engineer & AI Estimator</h1>
          <p>Анализ тендерной документации • 13 разделов (Московский стандарт)</p>
        </div>
        <Button
          variant="ghost"
          icon={<RotateCcw size={16} />}
          onClick={resetAll}
        >
          Сброс
        </Button>
      </header>

      <WorkflowStepper
        currentPhase={currentPhase}
        onPhaseClick={handlePhaseClick}
        canNavigateTo={canProceedToPhase}
      />

      <main className={styles.content}>
        {currentPhase === 'ingestion' && (
          <DocumentIngestionPanel
            onStartProcessing={handleStartProcessing}
            onStartDemo={handleStartDemo}
          />
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

export function TenderAnalysis() {
  return (
    <TenderProvider>
      <TenderAnalysisContent />
    </TenderProvider>
  );
}

// Generate realistic Moscow construction BOQ items
function generateMockBOQItems(): ExtractedBOQItem[] {
  const items: ExtractedBOQItem[] = [
    // 1. ВЗиС
    { id: 'item-1', itemNumber: '1.1', description: 'Ограждение строительной площадки (профлист h=2м)', unit: 'м.п.', quantity: 480, rate: 2800, amount: 1344000, scope: 'vzis', confidence: 0.96, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },
    { id: 'item-2', itemNumber: '1.2', description: 'Устройство временных дорог из ж/б плит', unit: 'м²', quantity: 1200, rate: 2200, amount: 2640000, scope: 'vzis', confidence: 0.94, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },

    // 2. Земляные работы
    { id: 'item-3', itemNumber: '2.1', description: 'Разработка грунта котлована с утилизацией', unit: 'м³', quantity: 4500, rate: 580, amount: 2610000, scope: 'earthwork', confidence: 0.97, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },
    { id: 'item-4', itemNumber: '2.2', description: 'Обратная засыпка пазух с уплотнением', unit: 'м³', quantity: 1100, rate: 420, amount: 462000, scope: 'earthwork', confidence: 0.93, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },

    // 3. Ограждение котлована
    { id: 'item-5', itemNumber: '3.1', description: 'Шпунтовое ограждение Ларсен IV', unit: 'м²', quantity: 850, rate: 4200, amount: 3570000, scope: 'excavation', confidence: 0.91, sourceDocument: 'Тех_отчёт.pdf', validationFlags: [] },

    // 4. Водопонижение
    { id: 'item-6', itemNumber: '4.1', description: 'Устройство иглофильтров', unit: 'шт', quantity: 45, rate: 18000, amount: 810000, scope: 'dewatering', confidence: 0.89, sourceDocument: 'Тех_отчёт.pdf', validationFlags: [] },

    // 5. Свайные работы
    { id: 'item-7', itemNumber: '5.1', description: 'Забивка ж/б свай 300х300 L=12м', unit: 'шт', quantity: 186, rate: 28000, amount: 5208000, scope: 'piling', confidence: 0.95, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },

    // 6. Монолит (Ниже 0)
    { id: 'item-8', itemNumber: '6.1', description: 'Бетон B25 W8 F150 фундаментной плиты', unit: 'м³', quantity: 420, rate: 9500, amount: 3990000, scope: 'monolith_below', confidence: 0.98, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },
    { id: 'item-9', itemNumber: '6.2', description: 'Бетон B25 W6 стен подвала', unit: 'м³', quantity: 380, rate: 9200, amount: 3496000, scope: 'monolith_below', confidence: 0.94, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },

    // 7. Монолит (Выше 0)
    { id: 'item-10', itemNumber: '7.1', description: 'Бетон B25 перекрытий (17 этажей)', unit: 'м³', quantity: 2800, rate: 8800, amount: 24640000, scope: 'monolith_above', confidence: 0.96, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },
    { id: 'item-11', itemNumber: '7.2', description: 'Арматура А500С каркаса здания', unit: 'тн', quantity: 420, rate: 98000, amount: 41160000, scope: 'monolith_above', confidence: 0.95, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },

    // 8. Гидроизоляция/Утепление
    { id: 'item-12', itemNumber: '8.1', description: 'Гидроизоляция фундамента (битумная мастика)', unit: 'м²', quantity: 1800, rate: 480, amount: 864000, scope: 'waterproofing', confidence: 0.92, sourceDocument: 'Тех_отчёт.pdf', validationFlags: [] },
    { id: 'item-13', itemNumber: '8.2', description: 'Утепление цоколя ЭППС 100мм', unit: 'м²', quantity: 650, rate: 1200, amount: 780000, scope: 'waterproofing', confidence: 0.90, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },

    // 9. Кладка/Перегородки
    { id: 'item-14', itemNumber: '9.1', description: 'Кладка наружных стен из газобетона D500', unit: 'м³', quantity: 1250, rate: 5200, amount: 6500000, scope: 'masonry', confidence: 0.93, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },
    { id: 'item-15', itemNumber: '9.2', description: 'Кладка перегородок из кирпича 120мм', unit: 'м²', quantity: 4500, rate: 1400, amount: 6300000, scope: 'masonry', confidence: 0.91, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },

    // 10. Кровля
    { id: 'item-16', itemNumber: '10.1', description: 'Устройство плоской кровли (ПВХ мембрана)', unit: 'м²', quantity: 1800, rate: 3200, amount: 5760000, scope: 'roofing', confidence: 0.95, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },

    // 11. Фасад
    { id: 'item-17', itemNumber: '11.1', description: 'Навесной вентилируемый фасад (керамогранит)', unit: 'м²', quantity: 8500, rate: 4800, amount: 40800000, scope: 'facade', confidence: 0.94, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },

    // 12. Окна/Витражи
    { id: 'item-18', itemNumber: '12.1', description: 'Окна ПВХ двухкамерные', unit: 'м²', quantity: 3200, rate: 8500, amount: 27200000, scope: 'windows', confidence: 0.92, sourceDocument: 'BOQ_Клиента.xlsx', validationFlags: [] },
    { id: 'item-19', itemNumber: '12.2', description: 'Витражи входных групп (алюминий)', unit: 'м²', quantity: 180, rate: 18000, amount: 3240000, scope: 'windows', confidence: 0.88, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [{ type: 'readiness', severity: 'warning', message: 'Уточнить тип профиля' }] },

    // 13. Благоустройство
    { id: 'item-20', itemNumber: '13.1', description: 'Асфальтобетонное покрытие дорог', unit: 'м²', quantity: 2800, rate: 1800, amount: 5040000, scope: 'external', confidence: 0.93, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },
    { id: 'item-21', itemNumber: '13.2', description: 'Устройство детской площадки', unit: 'компл', quantity: 1, rate: 2500000, amount: 2500000, scope: 'external', confidence: 0.90, sourceDocument: 'ТЗ_Жилой_дом.pdf', validationFlags: [] },
  ];

  return items;
}
