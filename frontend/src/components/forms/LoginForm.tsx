import { useState, type FormEvent } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error: string | null;
}

export function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email"
        type="email"
        required
        autoFocus
        placeholder="gov@demo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="demo123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-xs text-text-muted hover:text-text-primary cursor-pointer"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>

      <div className="text-center">
        <Link to="/" className="text-sm text-brand-600 hover:underline">
          View public dashboard →
        </Link>
      </div>

      {/* Demo credentials hint */}
      <div className="bg-surface-secondary rounded-lg p-3 mt-4">
        <p className="text-xs text-text-muted font-medium mb-1.5">Demo Accounts:</p>
        <div className="space-y-0.5 text-xs text-text-muted font-mono">
          <p>gov@demo.com / demo123 (Government)</p>
          <p>build@demo.com / demo123 (Contractor)</p>
        </div>
      </div>
    </form>
  );
}
