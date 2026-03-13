import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

interface RoleRouteProps {
  role: UserRole;
  children: React.ReactNode;
}

export function RoleRoute({ role, children }: RoleRouteProps) {
  const { isAuthenticated, role: userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-2">403</h1>
          <p className="text-text-secondary mb-4">You don't have permission to access this page.</p>
          <a href="/dashboard" className="text-brand-600 hover:underline">← Go to Dashboard</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
