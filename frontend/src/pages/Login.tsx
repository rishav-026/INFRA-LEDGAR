import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/forms/LoginForm';
import { useAuth } from '../context/AuthContext';
import { Gem, Sparkles } from 'lucide-react';

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
    <main className="fixed inset-0 w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-[#5e5874] via-[#6a6484] to-[#8a87a3]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0)_55%)]" />

      <div className="relative w-full h-full bg-[#232033]/92 p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-full">
          <section className="relative h-full overflow-hidden border-r border-white/10 bg-linear-to-br from-[#6f5ace] to-[#2f214f] p-6 md:p-8">
            <img
              src="https://neumo.com/wp-content/uploads/2026/01/digital-government-building.jpeg"
              alt="Government transparency visual"
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#1e1442]/55 via-[#2b1a55]/45 to-[#0f0a22]/85" />

            <div className="flex items-center gap-3 text-white/95 mb-3">
              <div className="relative w-10 h-10 rounded-xl bg-white/12 border border-white/25 backdrop-blur-sm grid place-items-center shadow-[0_12px_25px_rgba(20,10,40,0.35)]">
                <Gem size={16} className="text-violet-100" />
                <Sparkles size={10} className="absolute -top-1 -right-1 text-violet-200" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">InfraLedger</p>
                <p className="text-[10px] text-violet-200/90">Gov Transparency Suite</p>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-10 h-44 bg-[radial-gradient(ellipse_at_center,rgba(148,118,255,0.35)_0%,rgba(34,17,70,0.45)_42%,rgba(15,8,34,0)_75%)]" />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-black/55 to-transparent" />

            <div className="absolute bottom-6 left-5 text-white">
              <p className="text-lg leading-tight font-medium">Tracking Projects,</p>
              <p className="text-lg leading-tight font-medium">Building Transparency</p>
            </div>
          </section>

          <section className="h-full bg-[#2a253a] p-6 md:p-10 overflow-auto flex items-center justify-center">
            <div className="w-full max-w-md">
            <div className="mb-5">
              <h1 className="text-3xl font-semibold text-white leading-tight">Sign in</h1>
              <p className="text-xs text-slate-400 mt-1">Already have an account? Login</p>
            </div>

            <LoginForm onSubmit={handleLogin} error={error} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
