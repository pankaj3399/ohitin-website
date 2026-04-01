import {
  LogOut,
  Menu,
  PanelLeftClose,
  LayoutDashboard,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../auth/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  return (
    <div className="admin-font min-h-screen text-slate-200" style={{ background: '#0B0F14' }}>
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r px-4 py-5 transition-transform duration-300 md:static md:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            background: 'rgba(8, 11, 16, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo / Brand & Logout */}
          <div className="mb-8 flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                  border: '1px solid rgba(59,130,246,0.15)',
                }}
              >
                <Shield size={16} className="text-blue-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-semibold text-white">Admin</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                  Internal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:hidden">
              <button
                type="button"
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-slate-500 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
              
              <button
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white md:hidden"
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={() =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
                    }`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                  style={() =>
                    isActive
                      ? {
                          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.08))',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                        }
                      : {}
                  }
                >
                  {/* Left indicator accent */}
                  <div 
                    className={`absolute left-0 h-4 w-[2.5px] rounded-r-full transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
                    }`}
                    style={{ background: 'linear-gradient(180deg, #3B82F6, #6366F1)' }}
                  />
                  
                  <Icon 
                    size={16} 
                    className={`relative z-10 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} 
                  />
                  
                  <span className="relative z-10">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div
            className="mt-auto rounded-xl p-3"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[13px] font-bold text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {admin?.email?.[0].toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">{admin?.email}</p>
                <p className="text-[10px] font-medium text-slate-500">Administrator</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="relative flex-1 px-4 py-8 md:px-8">
          {/* Top corner Logout */}
          <div className="absolute top-6 right-6 z-20 hidden md:block">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2 text-[12px] font-semibold text-slate-400 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400 backdrop-blur-md"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <div
        className="flex items-center justify-between border-b px-4 py-3 md:hidden"
        style={{ background: 'rgba(5, 7, 9, 0.8)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-400" />
          <span className="text-[14px] font-bold text-white">Admin Panel</span>
        </div>
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-white/5"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>
    </div>
  );
}
