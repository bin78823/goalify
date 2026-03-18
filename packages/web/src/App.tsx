import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider, Toaster } from '@goalify/ui';
import { GanttProvider, useGanttStore } from './contexts/GanttContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/Layout';
import ProjectsPage from './pages/ProjectsPage';
import GanttPage from './pages/GanttPage';

function AppContent() {
  const loadProjects = useGanttStore((s) => s.loadProjects);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<GanttPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <GanttProvider>
          <AppContent />
          <Toaster richColors position="top-right" />
        </GanttProvider>
      </TooltipProvider>
    </I18nextProvider>
  );
}

export default App;
