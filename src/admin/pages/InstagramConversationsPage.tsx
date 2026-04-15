import { useCallback, useEffect, useState } from 'react';
import {
  exportInstagramCsv,
  fetchInstagramConversation,
  fetchInstagramConversations,
  fetchInstagramOverview,
  getApiErrorMessage,
} from '../api/admin';
import { useAdminAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { InstagramConversationDetail } from '../components/InstagramConversationDetail';
import { InstagramFiltersPanel } from '../components/InstagramFiltersPanel';
import type {
  InstagramConversation,
  InstagramConversationListResponse,
  InstagramFilters,
  InstagramOverviewMetrics,
} from '../types';
import { downloadBlob, formatDate, formatNumber } from '../utils/format';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Inbox,
  MessageCircle,
  Mail,
  Phone,
  SlidersHorizontal,
  Users,
  CheckCircle2,
  Zap,
} from 'lucide-react';

const defaultOverview: InstagramOverviewMetrics = {
  totalConversations: 0,
  activeConversations: 0,
  completedConversations: 0,
  emailsCaptured: 0,
  phonesCaptured: 0,
};

const defaultList: InstagramConversationListResponse = {
  rows: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

const initialFilters: InstagramFilters = {
  page: 1,
  limit: 10,
  search: '',
  status: '',
  profileType: '',
  tag: '',
  startDate: '',
  endDate: '',
};

const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', dot: '#3B82F6' },
  WAITING_FOR_CONTACT: { bg: 'rgba(245,158,11,0.1)', text: '#FBBF24', dot: '#F59E0B' },
  COMPLETED: { bg: 'rgba(16,185,129,0.1)', text: '#34D399', dot: '#10B981' },
};

const tagColorMap: Record<string, { bg: string; text: string; border: string }> = {
  INVESTOR: { bg: 'rgba(139,92,246,0.12)', text: '#C4B5FD', border: 'rgba(139,92,246,0.2)' },
  CREATIVE: { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD', border: 'rgba(59,130,246,0.2)' },
  GENERAL: { bg: 'rgba(100,116,139,0.12)', text: '#94A3B8', border: 'rgba(100,116,139,0.2)' },
  VIP: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
  TALENT: { bg: 'rgba(236,72,153,0.12)', text: '#F9A8D4', border: 'rgba(236,72,153,0.2)' },
  BRAND: { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  EMAIL_RECEIVED: { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  PHONE_RECEIVED: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
};

const defaultTagColor = { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', border: 'rgba(100,116,139,0.15)' };
const defaultStatusColor = { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', dot: '#64748B' };

const overviewCards = [
  {
    key: 'totalConversations' as const,
    label: 'Total Conversations',
    icon: MessageCircle,
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))',
    iconBg: 'rgba(236,72,153,0.12)',
    iconColor: '#F472B6',
    borderColor: 'rgba(236,72,153,0.1)',
  },
  {
    key: 'activeConversations' as const,
    label: 'Active',
    icon: Zap,
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#60A5FA',
    borderColor: 'rgba(59,130,246,0.1)',
  },
  {
    key: 'completedConversations' as const,
    label: 'Completed',
    icon: CheckCircle2,
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#34D399',
    borderColor: 'rgba(16,185,129,0.1)',
  },
  {
    key: 'emailsCaptured' as const,
    label: 'Emails Captured',
    icon: Mail,
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
    iconBg: 'rgba(139,92,246,0.12)',
    iconColor: '#A78BFA',
    borderColor: 'rgba(139,92,246,0.1)',
  },
  {
    key: 'phonesCaptured' as const,
    label: 'Phones Captured',
    icon: Phone,
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#FBBF24',
    borderColor: 'rgba(245,158,11,0.1)',
  },
];

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="skeleton-shimmer h-4 rounded-md" style={{ width: i === 5 ? '100px' : '70px' }} />
        </td>
      ))}
    </tr>
  );
}

export default function InstagramConversationsPage() {
  const { refreshAdmin, logout } = useAdminAuth();
  const [filters, setFilters] = useState<InstagramFilters>(initialFilters);
  const [overview, setOverview] = useState<InstagramOverviewMetrics>(defaultOverview);
  const [list, setList] = useState<InstagramConversationListResponse>(defaultList);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<InstagramConversation | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.profileType,
    filters.tag,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const admin = await refreshAdmin();
        if (!admin || !isMounted) return;

        const [overviewData, listData] = await Promise.all([
          fetchInstagramOverview(),
          fetchInstagramConversations(filters),
        ]);
        if (!isMounted) return;

        setOverview(overviewData);
        setList(listData);
      } catch (err) {
        const message = getApiErrorMessage(err, 'Unable to load Instagram data.');
        if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('401')) {
          logout();
          return;
        }
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void load();
    return () => { isMounted = false; };
  }, [filters, logout, refreshAdmin]);

  function handleFilterChange(key: keyof InstagramFilters, value: string | number) {
    setFilters((c) => ({ ...c, [key]: value, page: key === 'page' ? Number(value) : 1 }));
  }

  function handleReset() {
    setFilters(initialFilters);
  }

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await exportInstagramCsv(filters);
      downloadBlob(blob, `instagram-conversations-page-${filters.page}.csv`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to export CSV.'));
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  async function openConversation(id: string) {
    setIsDetailLoading(true);
    try {
      const conv = await fetchInstagramConversation(id);
      setSelectedConversation(conv);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load conversation.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  const totalPages = Math.max(list.pagination.totalPages, 1);

  function getPageNumbers() {
    const pages: (number | 'ellipsis')[] = [];
    const current = list.pagination.page;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('ellipsis');
      for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
      if (current < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }

  // Detail slide-over view
  if (selectedConversation) {
    return (
      <DashboardLayout>
        <div
          className="overflow-hidden rounded-2xl border animate-[fadeInUp_0.4s_ease-out]"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.06)',
            height: 'calc(100vh - 160px)',
          }}
        >
          <InstagramConversationDetail
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="animate-[fadeInUp_0.5s_ease-out]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Instagram
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                DM Conversations
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
                Monitor Instagram DM conversations powered by AI automation. View threads, captured leads, and conversation status.
              </p>
            </div>
            <div
              className="flex items-center gap-2 self-start rounded-lg px-3 py-1.5 lg:self-auto"
              style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.12)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
              </span>
              <span className="text-[11px] font-medium text-pink-400">Instagram AI Active</span>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#FCA5A5' }}
          >
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {/* Overview Cards */}
        <section className="stagger-fade grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {overviewCards.map((item) => {
            const Icon = item.icon;
            const value = overview[item.key];
            return (
              <article
                key={item.key}
                className="group cursor-default rounded-2xl border p-5 transition-all duration-300"
                style={{ background: item.gradient, borderColor: item.borderColor, backdropFilter: 'blur(12px)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: item.iconBg }}>
                    <Icon size={18} style={{ color: item.iconColor }} />
                  </div>
                </div>
                <p className="text-[12px] font-medium text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(value)}</p>
              </article>
            );
          })}
        </section>

        {/* Loading detail overlay */}
        {isDetailLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
          </div>
        )}

        {/* Table */}
        <section
          className="overflow-hidden rounded-2xl border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Table Header */}
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Database size={14} className="text-slate-400" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-slate-200">Conversations</h2>
                <p className="text-[11px] text-slate-500">Page {list.pagination.page} of {totalPages}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400 sm:block" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {list.pagination.total} records
              </div>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                type="button"
                onClick={() => void handleExport()}
                disabled={isExporting}
              >
                <Download size={12} />
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(true)}
                className="relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium text-slate-400 transition-all duration-200 hover:border-pink-500/20 hover:bg-pink-500/5 hover:text-pink-400"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Table body */}
          <div className="admin-scrollbar overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr
                  className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {['Sender', 'Profile', 'Status', 'Email', 'Phone', 'Tags', 'Last Message', 'Date'].map((label) => (
                    <th key={label} className="px-5 py-3 font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                ) : list.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <Inbox size={24} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-slate-400">No conversations found</p>
                          <p className="mt-1 text-[12px] text-slate-600">Try adjusting your filters to see more results</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.rows.map((row, index) => {
                    const sc = statusColorMap[row.status] || defaultStatusColor;
                    return (
                      <tr
                        key={row._id}
                        className="group cursor-pointer transition-colors duration-150"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: index % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                        onClick={() => void openConversation(row._id)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent'; }}
                      >
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-[12px] font-medium text-slate-300">{row.senderName || row.senderId}</p>
                            {row.senderName && <p className="text-[10px] font-mono text-slate-600">{row.senderId.slice(0, 12)}...</p>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] capitalize text-slate-400">{row.profileType || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: sc.dot }} />
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-slate-400">
                          {row.capturedData?.email || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-slate-400">
                          {row.capturedData?.phone || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex max-w-[160px] flex-wrap gap-1">
                            {row.tags.length ? (
                              row.tags.slice(0, 3).map((tag) => {
                                const tc = tagColorMap[tag.toUpperCase()] || defaultTagColor;
                                return (
                                  <span
                                    key={tag}
                                    className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                                    style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                                  >
                                    {tag}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[12px] text-slate-600">—</span>
                            )}
                            {row.tags.length > 3 && (
                              <span className="text-[10px] text-slate-500">+{row.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="max-w-[180px] truncate px-5 py-3.5 text-[12px] text-slate-500">
                          {row.lastMessagePreview || '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-slate-500">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-[12px] text-slate-500">
              Showing {list.rows.length > 0 ? (list.pagination.page - 1) * list.pagination.limit + 1 : 0}–
              {Math.min(list.pagination.page * list.pagination.limit, list.pagination.total)} of {list.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                type="button"
                onClick={() => handleFilterChange('page', list.pagination.page - 1)}
                disabled={list.pagination.page <= 1 || isLoading}
              >
                <ChevronLeft size={14} />
              </button>
              {getPageNumbers().map((page, i) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-[12px] text-slate-600">...</span>
                ) : (
                  <button
                    key={page}
                    className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg text-[12px] font-medium transition-all duration-200"
                    style={
                      page === list.pagination.page
                        ? { background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', color: 'white' }
                        : { color: '#94A3B8', border: '1px solid transparent' }
                    }
                    onMouseEnter={(e) => { if (page !== list.pagination.page) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { if (page !== list.pagination.page) e.currentTarget.style.background = 'transparent'; }}
                    type="button"
                    onClick={() => handleFilterChange('page', page)}
                    disabled={isLoading}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                type="button"
                onClick={() => handleFilterChange('page', list.pagination.page + 1)}
                disabled={list.pagination.page >= list.pagination.totalPages || isLoading}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>

      <InstagramFiltersPanel
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        onExport={handleExport}
        isExporting={isExporting}
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
      />
    </DashboardLayout>
  );
}
