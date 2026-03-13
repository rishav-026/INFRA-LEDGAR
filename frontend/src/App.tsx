import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToastContext } from './context/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import { ProtectedRoute, RoleRoute } from './components/routing/Guards';

// Pages
import PublicDashboard from './pages/PublicDashboard';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import AuthDashboard from './pages/AuthDashboard';
import CreateProject from './pages/CreateProject';
import UploadProof from './pages/UploadProof';
import AdminPanel from './pages/AdminPanel';

function ToastLayer() {
  const { toasts, removeToast } = useToastContext();
  return <ToastContainer toasts={toasts} onRemove={removeToast} />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/project/:id" element={<ProjectDetail />} />
      <Route path="/login" element={<Login />} />

      {/* Authenticated */}
      <Route path="/dashboard" element={<ProtectedRoute><AuthDashboard /></ProtectedRoute>} />

      {/* Government only */}
      <Route path="/projects/new" element={<RoleRoute role="government"><CreateProject /></RoleRoute>} />

      {/* Contractor only */}
      <Route path="/projects/:id/proof" element={<RoleRoute role="contractor"><UploadProof /></RoleRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<RoleRoute role="government"><AdminPanel /></RoleRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
            <p className="text-text-secondary mb-4">Page not found</p>
            <a href="/" className="text-brand-600 hover:underline">← Back to Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ToastLayer />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
