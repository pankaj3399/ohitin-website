import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../auth/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedAdminRoute() {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAdminAuth();

  if (isInitializing) {
    return (
      <div
        className="admin-font flex min-h-screen flex-col items-center justify-center gap-4 px-6"
        style={{ background: '#0B0F14' }}
      >
        <Loader2 size={24} className="animate-spin text-blue-400" />
        <p className="text-[13px] text-slate-500">Verifying admin session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
