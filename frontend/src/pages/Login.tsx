import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { LoginForm } from '../components/forms/LoginForm';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      const role = await login(email, password);
      navigate(role === 'citizen' ? '/' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <PageLayout maxWidth="max-w-md">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
              IL
            </div>
            <h1 className="text-xl font-bold text-text-primary">Sign in to InfraLedger</h1>
            <p className="text-sm text-text-secondary mt-1">Track infrastructure spending transparently</p>
          </div>
          <LoginForm onSubmit={handleLogin} error={error} />
        </div>
      </div>
    </PageLayout>
  );
}
