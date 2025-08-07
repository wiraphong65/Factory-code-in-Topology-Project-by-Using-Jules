import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { Login } from './components/Login';
import MainLayout from './components/MainLayout';
import { ProjectDashboard } from './components/ProjectDashboard';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { currentProject, loading: projectLoading } = useProject();

  console.log('AppContent render - user:', user?.username, 'authLoading:', authLoading, 'projectLoading:', projectLoading, 'currentProject:', currentProject?.name);

  // รอให้ authentication และ project loading เสร็จ
  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // ถ้ามี currentProject ให้แสดง MainLayout
  if (currentProject) {
    return <MainLayout />;
  }

  // ถ้าไม่มี currentProject ให้แสดง ProjectDashboard
  return <ProjectDashboard />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <AppContent />
          <Toaster />
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
