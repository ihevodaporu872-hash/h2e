import { Upload, Layers, CheckCircle, FileSpreadsheet } from 'lucide-react';
import type { TenderWorkflowPhase } from '../../../types/tender';
import { WORKFLOW_PHASE_LABELS } from '../../../constants/scopes';
import styles from './WorkflowStepper.module.css';

interface WorkflowStepperProps {
  currentPhase: TenderWorkflowPhase;
  onPhaseClick: (phase: TenderWorkflowPhase) => void;
  canNavigateTo: (phase: TenderWorkflowPhase) => boolean;
}

const PHASES: TenderWorkflowPhase[] = ['ingestion', 'alignment', 'analysis', 'output'];

const PHASE_ICONS = {
  ingestion: Upload,
  alignment: Layers,
  analysis: CheckCircle,
  output: FileSpreadsheet
};

export function WorkflowStepper({ currentPhase, onPhaseClick, canNavigateTo }: WorkflowStepperProps) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div className={styles.stepper}>
      {PHASES.map((phase, index) => {
        const Icon = PHASE_ICONS[phase];
        const isActive = phase === currentPhase;
        const isCompleted = index < currentIndex;
        const canNavigate = canNavigateTo(phase);
        const isLast = index === PHASES.length - 1;

        return (
          <div key={phase} className={styles.stepWrapper}>
            <button
              className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
              onClick={() => canNavigate && onPhaseClick(phase)}
              disabled={!canNavigate}
            >
              <div className={styles.iconWrapper}>
                <Icon size={20} />
              </div>
              <div className={styles.stepInfo}>
                <span className={styles.stepNumber}>Шаг {index + 1}</span>
                <span className={styles.stepLabel}>{WORKFLOW_PHASE_LABELS[phase]}</span>
              </div>
            </button>
            {!isLast && (
              <div className={`${styles.connector} ${isCompleted ? styles.connectorCompleted : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
