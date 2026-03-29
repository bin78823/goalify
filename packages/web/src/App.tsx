import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { TooltipProvider, Toaster } from "@goalify/ui";
import { GanttProvider, useGanttStore } from "./contexts/GanttContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import Layout from "./components/Layout";
import ProjectsPage from "./pages/ProjectsPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import GanttPage from "./pages/GanttPage";
import SubtaskBoardPage from "./pages/SubtaskBoardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { useAuthStore } from "./stores/AuthStore";

function AppContent() {
  const loadProjects = useGanttStore((s) => s.loadProjects);
  const syncVersion = useAuthStore((s) => s.syncVersion);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (syncVersion > 0) {
      loadProjects();
    }
  }, [syncVersion, loadProjects]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<GanttPage />} />
          <Route path="subtask/:taskId" element={<SubtaskBoardPage />} />
        </Route>
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider delayDuration={1000}>
        <GanttProvider>
          <AppContent />
          <Toaster richColors position="top-right" />
        </GanttProvider>
      </TooltipProvider>
    </I18nextProvider>
  );
}

export default App;
