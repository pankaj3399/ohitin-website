import {
  LogOut,
  Menu,
  PanelLeftClose,
  LayoutDashboard,
  BarChart3,
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
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const adminLabel = admin?.username?.trim() || 'Administrator';
  const adminInitial = adminLabel[0]?.toUpperCase() || 'A';

  const currentPage = navItems.find((item) => item.to === location.pathname);

  return (
    <div className="admin-font flex h-screen text-slate-200" style={{ background: '#0B0F14' }}>
      {/* ── Sidebar (desktop: static in flex, mobile: fixed overlay) ── */}
      <aside
        className={`admin-scrollbar fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'rgba(8, 11, 16, 0.98)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 py-5">
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
            <div>
              <p className="text-[13px] font-semibold text-white">Admin</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                Internal
              </p>
            </div>
          </div>

          {/* Mobile close / logout */}
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
        <nav className="flex-1 space-y-1 px-3">
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
                    isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
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

        {/* Sidebar footer — admin info + logout */}
        <div className="px-3 pb-4">
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(255, 255, 255, 0.02)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {adminInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-white">{adminLabel}</p>
                <p className="text-[10px] font-medium text-slate-500">Administrator</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="hidden flex-shrink-0 rounded-lg p-1.5 text-slate-600 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 md:block"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Main content column ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ── Top bar ── */}
        <header
          className="flex h-14 flex-shrink-0 items-center justify-between border-b px-4 md:px-8"
          style={{
            background: 'rgba(8, 11, 16, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Left: hamburger (mobile) + page title */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              <Menu size={20} />
            </button>

            {/* Mobile brand */}
            <div className="flex items-center gap-2 md:hidden">
              <Shield size={16} className="text-blue-400" />
              <span className="text-[13px] font-bold text-white">Admin</span>
            </div>

            {/* Desktop breadcrumb */}
            {currentPage && (
              <div className="hidden items-center gap-2 md:flex">
                <currentPage.icon size={15} className="text-slate-500" />
                <span className="text-[13px] font-medium text-slate-400">
                  {currentPage.label}
                </span>
              </div>
            )}
          </div>

          {/* Right: logout (desktop) */}
          <div className="hidden md:block">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-slate-400 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* ── Scrollable content area ── */}
        <main className="admin-scrollbar flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
