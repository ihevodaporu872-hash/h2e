import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Project, ProjectDocument } from '../types/project';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'documents'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addDocument: (projectId: string, document: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeDocument: (projectId: string, documentId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'ЖК "Новый Горизонт"',
    code: 'NH-2025',
    description: 'Жилой комплекс бизнес-класса, 3 корпуса',
    status: 'active',
    client: 'ООО "СтройИнвест"',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2026-12-31'),
    budget: 850000000,
    documents: [
      {
        id: 'd1',
        name: 'Смета_корпус_А.xlsx',
        type: 'estimate',
        status: 'approved',
        version: '2.1',
        size: 245000,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-15'),
        author: 'Иванов А.С.'
      },
      {
        id: 'd2',
        name: 'BOQ_фундамент.xlsx',
        type: 'boq',
        status: 'review',
        version: '1.3',
        size: 180000,
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-18'),
        author: 'Петров М.В.'
      }
    ],
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2025-01-18')
  },
  {
    id: '2',
    name: 'Бизнес-центр "Омега"',
    code: 'BC-OMG',
    description: 'Офисный центр класса А, 25 этажей',
    status: 'active',
    client: 'АО "Омега Групп"',
    startDate: new Date('2024-09-01'),
    budget: 1200000000,
    documents: [
      {
        id: 'd3',
        name: 'Смета_общестрой.xlsx',
        type: 'estimate',
        status: 'draft',
        version: '0.9',
        size: 320000,
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-20'),
        author: 'Сидорова Е.П.'
      }
    ],
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date('2025-01-20')
  },
  {
    id: '3',
    name: 'Складской комплекс "Логистик"',
    code: 'WH-LOG',
    status: 'on_hold',
    client: 'ООО "ЛогистикПро"',
    startDate: new Date('2024-03-01'),
    budget: 450000000,
    documents: [],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-11-15')
  }
];

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(mockProjects[0]);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'documents'>) => {
    const newProject: Project = {
      ...projectData,
      id: Math.random().toString(36).substring(2, 9),
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
    if (currentProject?.id === id) {
      setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  }, [currentProject]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  }, [currentProject]);

  const addDocument = useCallback((projectId: string, docData: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDoc: ProjectDocument = {
      ...docData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, documents: [...p.documents, newDoc], updatedAt: new Date() }
        : p
    ));
  }, []);

  const removeDocument = useCallback((projectId: string, documentId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? { ...p, documents: p.documents.filter(d => d.id !== documentId), updatedAt: new Date() }
        : p
    ));
  }, []);

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      setCurrentProject,
      addProject,
      updateProject,
      deleteProject,
      addDocument,
      removeDocument
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
