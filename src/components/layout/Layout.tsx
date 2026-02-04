import type { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
  onNewProject?: () => void;
}

export function Layout({ children, onNewProject }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Header onNewProject={onNewProject} />
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
