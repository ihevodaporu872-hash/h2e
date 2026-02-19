import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProjectProvider } from './context/ProjectContext';
import { Layout } from './components/layout/Layout';
import { ToastContainer } from './components/ui/Toast';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Estimates } from './pages/Estimates';
import { Compare } from './pages/Compare';
import { BOQ } from './pages/BOQ';
import { BOQExtract } from './pages/BOQExtract';
import { Risks } from './pages/Risks';
import { QA } from './pages/QA';
import { Settings } from './pages/Settings';
import './styles/globals.css';

function App() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <ProjectProvider>
          <BrowserRouter>
            <Layout onNewProject={() => setIsNewProjectOpen(true)}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/estimates" element={<Estimates />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/boq" element={<BOQ />} />
                <Route path="/boq-extract" element={<BOQExtract />} />
                <Route path="/risks" element={<Risks />} />
                <Route path="/qa" element={<QA />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>

            <NewProjectModal
              isOpen={isNewProjectOpen}
              onClose={() => setIsNewProjectOpen(false)}
            />
            <ToastContainer />
          </BrowserRouter>
        </ProjectProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
