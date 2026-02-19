// ============================================
// Tender/BOQ Analysis Types
// H2E Document Management System
// ============================================

// Workflow phases
export type TenderWorkflowPhase = 'ingestion' | 'alignment' | 'analysis' | 'output';

// Document types for tender
export type TenderDocumentType =
  | 'scope_of_works'
  | 'technical_report'
  | 'client_boq'
  | 'specifications'
  | 'drawings_list'
  | 'other';

// Processing status
export type DocumentProcessingStatus =
  | 'pending'
  | 'uploading'
  | 'parsing'
  | 'extracted'
  | 'categorized'
  | 'error';

// 13 Mandatory Construction Scopes (Moscow Standard - Общестрой)
export type ConstructionScope =
  | 'vzis'            // 1. ВЗиС (Временные здания и сооружения)
  | 'earthwork'       // 2. Земляные работы
  | 'excavation'      // 3. Ограждение котлована
  | 'dewatering'      // 4. Водопонижение
  | 'piling'          // 5. Свайные работы
  | 'monolith_below'  // 6. Монолит (Ниже 0)
  | 'monolith_above'  // 7. Монолит (Выше 0)
  | 'waterproofing'   // 8. Гидроизоляция/Утепление
  | 'masonry'         // 9. Кладка/Перегородки
  | 'roofing'         // 10. Кровля
  | 'facade'          // 11. Фасад
  | 'windows'         // 12. Окна/Витражи
  | 'external';       // 13. Благоустройство

// Tender document
export interface TenderDocument {
  id: string;
  file: File;
  name: string;
  type: TenderDocumentType;
  status: DocumentProcessingStatus;
  size: number;
  uploadedAt: Date;
  parsedContent?: ParsedDocumentContent;
  error?: string;
}

// Parsed content
export interface ParsedDocumentContent {
  text: string;
  tables: ParsedTable[];
  sections: DocumentSection[];
  pageCount: number;
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  pageNumber: number;
}

export interface DocumentSection {
  title: string;
  content: string;
  level: number;
  pageNumber: number;
}

// Extracted BOQ item with extended metadata
export interface ExtractedBOQItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number | null;
  rate: number | null;
  amount: number | null;
  scope: ConstructionScope | null;
  confidence: number;
  sourceDocument: string;
  sourcePage?: number;
  specifications?: string;
  notes?: string;
  validationFlags: ValidationFlag[];
}

// Scope definition for UI
export interface ScopeDefinition {
  id: ConstructionScope;
  nameRu: string;
  nameEn: string;
  keywords: string[];
  icon: string; // lucide icon name
  color: string;
}

// Scope assignment
export interface ScopeAssignment {
  itemId: string;
  scopeId: ConstructionScope;
  confidence: number;
  manual: boolean;
}

// ============================================
// Validation Types
// ============================================

// Validation result container
export interface ValidationResult {
  crossCheckResults: CrossCheckResult[];
  anomalies: Anomaly[];
  hiddenWorks: HiddenWork[];
  supplierReadiness: SupplierReadinessReport;
  overallScore: number;
  timestamp: Date;
}

// Cross-document check
export interface CrossCheckResult {
  id: string;
  type: 'consistency' | 'coverage' | 'reference';
  severity: 'info' | 'warning' | 'error';
  description: string;
  sourceDocument: string;
  targetDocument: string;
  affectedItems: string[];
}

// Anomaly detection
export interface Anomaly {
  id: string;
  type: 'unit_mismatch' | 'quantity_outlier' | 'missing_data' | 'calculation_error';
  severity: 'low' | 'medium' | 'high';
  itemId: string;
  description: string;
  suggestion?: string;
  expected?: string;
  actual?: string;
}

// Hidden works detection
export interface HiddenWork {
  id: string;
  description: string;
  impliedBy: string;
  sourceSection: string;
  estimatedScope: ConstructionScope;
  confidence: number;
  suggestedItems: Partial<ExtractedBOQItem>[];
}

// Supplier readiness check
export interface SupplierReadinessReport {
  readyForRFQ: boolean;
  missingFields: MissingField[];
  ambiguousDescriptions: AmbiguousDescription[];
  readinessScore: number; // 0-100
}

export interface MissingField {
  itemId: string;
  field: 'unit' | 'quantity' | 'specifications';
  criticality: 'required' | 'recommended';
}

export interface AmbiguousDescription {
  itemId: string;
  issue: string;
  suggestion: string;
}

// Validation flag on items
export interface ValidationFlag {
  type: 'anomaly' | 'cross_check' | 'hidden_work' | 'readiness';
  severity: 'info' | 'warning' | 'error';
  message: string;
}

// ============================================
// BOQ Output Types
// ============================================

export interface AssembledBOQ {
  id: string;
  projectName: string;
  createdAt: Date;
  sections: BOQSection[];
  grandTotal: number;
  currency: string;
  itemCount: number;
}

export interface BOQSection {
  scope: ConstructionScope;
  nameRu: string;
  items: ExtractedBOQItem[];
  subtotal: number;
  itemCount: number;
}

// ============================================
// API Types
// ============================================

export interface ExtractRequest {
  files: File[];
  projectName: string;
}

export interface ExtractResponse {
  success: boolean;
  items: ExtractedBOQItem[];
  sections: { name: string; count: number; subtotal: number }[];
  totalItems: number;
  grandTotal: number;
  processingTime: number;
  error?: string;
}
