import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAdminAuth } from '../auth/AuthContext';
import { getApiErrorMessage } from '../api/admin';

interface RedirectState {
  from?: {
    pathname?: string;
  };
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleLogin(credentials: { username: string; password: string }) {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(credentials);
      const redirectPath =
        (location.state as RedirectState | null)?.from?.pathname || '/admin/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, 'Invalid username or password.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-font relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12"
      style={{ background: '#050709' }}
    >
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative w-full animate-[fadeInUp_0.6s_ease-out]">
        <LoginForm onSubmit={handleLogin} isSubmitting={isSubmitting} error={error} />
      </div>
    </div>
  );
}
