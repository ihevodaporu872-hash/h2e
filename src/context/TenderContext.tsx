import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  TenderWorkflowPhase,
  TenderDocument,
  ExtractedBOQItem,
  ScopeAssignment,
  ValidationResult,
  AssembledBOQ,
  ConstructionScope,
  DocumentProcessingStatus
} from '../types/tender';

interface TenderContextType {
  // Workflow state
  currentPhase: TenderWorkflowPhase;
  setCurrentPhase: (phase: TenderWorkflowPhase) => void;
  canProceedToPhase: (phase: TenderWorkflowPhase) => boolean;

  // Document ingestion
  uploadedDocuments: TenderDocument[];
  addDocument: (doc: TenderDocument) => void;
  removeDocument: (id: string) => void;
  updateDocumentStatus: (id: string, status: DocumentProcessingStatus, error?: string) => void;
  clearDocuments: () => void;

  // Extraction results
  extractedItems: ExtractedBOQItem[];
  setExtractedItems: (items: ExtractedBOQItem[]) => void;
  updateItem: (id: string, updates: Partial<ExtractedBOQItem>) => void;

  // Categorization
  scopeAssignments: ScopeAssignment[];
  assignItemToScope: (itemId: string, scopeId: ConstructionScope, manual?: boolean) => void;
  getItemsByScope: (scopeId: ConstructionScope) => ExtractedBOQItem[];
  getUncategorizedItems: () => ExtractedBOQItem[];

  // Validation
  validationResults: ValidationResult | null;
  setValidationResults: (results: ValidationResult) => void;
  isValidating: boolean;
  setIsValidating: (validating: boolean) => void;

  // Output
  generatedBOQ: AssembledBOQ | null;
  setGeneratedBOQ: (boq: AssembledBOQ) => void;

  // Processing state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  processingMessage: string;
  setProcessingMessage: (message: string) => void;

  // Reset
  resetAll: () => void;
}

const TenderContext = createContext<TenderContextType | undefined>(undefined);

export function TenderProvider({ children }: { children: ReactNode }) {
  // Workflow
  const [currentPhase, setCurrentPhase] = useState<TenderWorkflowPhase>('ingestion');

  // Documents
  const [uploadedDocuments, setUploadedDocuments] = useState<TenderDocument[]>([]);

  // Extraction
  const [extractedItems, setExtractedItems] = useState<ExtractedBOQItem[]>([]);

  // Categorization
  const [scopeAssignments, setScopeAssignments] = useState<ScopeAssignment[]>([]);

  // Validation
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Output
  const [generatedBOQ, setGeneratedBOQ] = useState<AssembledBOQ | null>(null);

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Check if can proceed to phase
  const canProceedToPhase = useCallback((phase: TenderWorkflowPhase): boolean => {
    switch (phase) {
      case 'ingestion':
        return true;
      case 'alignment':
        return uploadedDocuments.length > 0 &&
               uploadedDocuments.some(d => d.status === 'extracted' || d.status === 'categorized');
      case 'analysis':
        return extractedItems.length > 0;
      case 'output':
        return extractedItems.length > 0 && validationResults !== null;
      default:
        return false;
    }
  }, [uploadedDocuments, extractedItems, validationResults]);

  // Document management
  const addDocument = useCallback((doc: TenderDocument) => {
    setUploadedDocuments(prev => [...prev, doc]);
  }, []);

  const removeDocument = useCallback((id: string) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  const updateDocumentStatus = useCallback((
    id: string,
    status: DocumentProcessingStatus,
    error?: string
  ) => {
    setUploadedDocuments(prev => prev.map(d =>
      d.id === id ? { ...d, status, error } : d
    ));
  }, []);

  const clearDocuments = useCallback(() => {
    setUploadedDocuments([]);
  }, []);

  // Item management
  const updateItem = useCallback((id: string, updates: Partial<ExtractedBOQItem>) => {
    setExtractedItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Scope assignment
  const assignItemToScope = useCallback((
    itemId: string,
    scopeId: ConstructionScope,
    manual = true
  ) => {
    setScopeAssignments(prev => {
      const existing = prev.find(a => a.itemId === itemId);
      if (existing) {
        return prev.map(a =>
          a.itemId === itemId
            ? { ...a, scopeId, manual, confidence: manual ? 1 : a.confidence }
            : a
        );
      }
      return [...prev, { itemId, scopeId, confidence: 1, manual }];
    });

    // Also update the item's scope
    setExtractedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, scope: scopeId } : item
    ));
  }, []);

  const getItemsByScope = useCallback((scopeId: ConstructionScope): ExtractedBOQItem[] => {
    return extractedItems.filter(item => item.scope === scopeId);
  }, [extractedItems]);

  const getUncategorizedItems = useCallback((): ExtractedBOQItem[] => {
    return extractedItems.filter(item => item.scope === null);
  }, [extractedItems]);

  // Reset everything
  const resetAll = useCallback(() => {
    setCurrentPhase('ingestion');
    setUploadedDocuments([]);
    setExtractedItems([]);
    setScopeAssignments([]);
    setValidationResults(null);
    setGeneratedBOQ(null);
    setIsProcessing(false);
    setProcessingMessage('');
  }, []);

  const value: TenderContextType = {
    currentPhase,
    setCurrentPhase,
    canProceedToPhase,
    uploadedDocuments,
    addDocument,
    removeDocument,
    updateDocumentStatus,
    clearDocuments,
    extractedItems,
    setExtractedItems,
    updateItem,
    scopeAssignments,
    assignItemToScope,
    getItemsByScope,
    getUncategorizedItems,
    validationResults,
    setValidationResults,
    isValidating,
    setIsValidating,
    generatedBOQ,
    setGeneratedBOQ,
    isProcessing,
    setIsProcessing,
    processingMessage,
    setProcessingMessage,
    resetAll
  };

  return (
    <TenderContext.Provider value={value}>
      {children}
    </TenderContext.Provider>
  );
}

export function useTender() {
  const context = useContext(TenderContext);
  if (context === undefined) {
    throw new Error('useTender must be used within a TenderProvider');
  }
  return context;
}
