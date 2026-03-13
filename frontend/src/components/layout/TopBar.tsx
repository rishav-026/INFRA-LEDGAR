import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LogOut, LayoutDashboard, FolderKanban, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function TopBar() {
  const { isAuthenticated, user, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = isAuthenticated
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { path: '/', label: 'Projects', icon: <FolderKanban size={16} /> },
        ...(role === 'government' ? [{ path: '/admin', label: 'Admin', icon: <ShieldCheck size={16} /> }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-text-primary font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              IL
            </div>
            <span className="hidden sm:inline">InfraLedger</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive(link.path) ? 'bg-brand-50 text-brand-700' : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'}
                `}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-3">
                <RoleBadge role={user.role} />
                <span className="text-sm text-text-secondary">{user.displayName}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-text-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              location.pathname !== '/login' && (
                <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
              )
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-muted hover:text-text-primary cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  ${isActive(link.path) ? 'bg-brand-50 text-brand-700' : 'text-text-secondary hover:bg-surface-secondary'}
                `}
              >
                {link.icon} {link.label}
              </Link>
            ))}
            {isAuthenticated && user && (
              <>
                <div className="px-3 py-2 flex items-center gap-2">
                  <RoleBadge role={user.role} />
                  <span className="text-sm text-text-secondary">{user.displayName}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 w-full cursor-pointer">
                  <LogOut size={16} /> Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
