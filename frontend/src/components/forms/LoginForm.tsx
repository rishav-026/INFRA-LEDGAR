import { useState, type FormEvent } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="relative">
        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          type="text"
          required
          autoFocus
          placeholder="Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 pl-9 rounded-md border-white/10 bg-[#332d47] text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <div className="relative">
        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          className="h-9 pl-9 pr-10 rounded-md border-white/10 bg-[#332d47] text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <div className="flex justify-end text-[10px] text-slate-400">
        <button type="button" className="hover:text-slate-200 cursor-pointer">Forgot?</button>
      </div>

      {error && <p className="text-xs text-red-300 bg-red-950/40 border border-red-900/70 px-3 py-2 rounded-md">{error}</p>}

      <Button
        type="submit"
        loading={loading}
        className="w-full h-9 rounded-md bg-violet-500 hover:bg-violet-400 text-white text-xs"
      >
        Create account
      </Button>

      <div className="pt-1 text-center space-y-1.5">
        <p className="text-[11px] text-slate-400">govt: Gov@gmail.com</p>
        <p className="text-[11px] text-slate-400">contractor : Buil@gmail.com</p>
        <Link to="/" className="text-[11px] text-violet-300 hover:underline">
          Public dashboard
        </Link>
      </div>
    </form>
  );
}
