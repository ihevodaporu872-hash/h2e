export type ProjectStatus = 'active' | 'completed' | 'archived' | 'on_hold';
export type DocumentType = 'estimate' | 'boq' | 'specification' | 'drawing' | 'contract' | 'report' | 'other';
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'rejected';

export interface ProjectDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  version: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  path?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: ProjectStatus;
  client?: string;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  documents: ProjectDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectStats {
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  totalBudget: number;
  estimatedCost: number;
}
