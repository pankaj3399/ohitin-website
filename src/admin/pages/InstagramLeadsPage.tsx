import { useCallback, useEffect, useState } from 'react';
import {
  exportInstagramCsv,
  fetchInstagramConversations,
  getApiErrorMessage,
} from '../api/admin';
import { useAdminAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import type { InstagramConversationListResponse, InstagramFilters } from '../types';
import { downloadBlob, formatDate } from '../utils/format';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Mail,
  Phone,
  Search,
  UserCheck,
} from 'lucide-react';

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

const tagFilterOptions = [
  { value: '', label: 'All Leads' },
  { value: 'EMAIL_RECEIVED', label: 'Email Captured' },
  { value: 'PHONE_RECEIVED', label: 'Phone Captured' },
];

export default function InstagramLeadsPage() {
  const { refreshAdmin, logout } = useAdminAuth();
  const [filters, setFilters] = useState<InstagramFilters>({ ...initialFilters, tag: 'EMAIL_RECEIVED' });
  const [list, setList] = useState<InstagramConversationListResponse>(defaultList);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const admin = await refreshAdmin();
        if (!admin || !isMounted) return;
        const data = await fetchInstagramConversations(filters);
        if (!isMounted) return;
        setList(data);
      } catch (err) {
        const message = getApiErrorMessage(err, 'Unable to load leads.');
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

  function handleSearch() {
    handleFilterChange('search', searchInput);
  }

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await exportInstagramCsv(filters);
      downloadBlob(blob, `instagram-leads-${filters.tag || 'all'}.csv`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to export CSV.'));
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

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
                Captured Leads
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
                View conversations where email or phone was captured via Instagram DM automation. Export leads as CSV.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <button
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' }}
                type="button"
                onClick={() => void handleExport()}
                disabled={isExporting}
              >
                <Download size={14} />
                {isExporting ? 'Exporting...' : 'Export Leads CSV'}
              </button>
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

        {/* Filters bar */}
        <div
          className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Tag filter tabs */}
          <div className="flex items-center gap-2">
            {tagFilterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-200"
                style={
                  filters.tag === opt.value
                    ? { background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))', color: '#F472B6', border: '1px solid rgba(236,72,153,0.2)' }
                    : { color: '#94A3B8', border: '1px solid rgba(255,255,255,0.06)' }
                }
                onClick={() => handleFilterChange('tag', opt.value)}
              >
                {opt.value === 'EMAIL_RECEIVED' && <Mail size={12} className="mr-1.5 inline" />}
                {opt.value === 'PHONE_RECEIVED' && <Phone size={12} className="mr-1.5 inline" />}
                {opt.value === '' && <UserCheck size={12} className="mr-1.5 inline" />}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative group flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="admin-input !py-1.5 !pl-9 !text-[12px]"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search leads..."
                style={{ width: '200px' }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <section
          className="overflow-hidden rounded-2xl border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="admin-scrollbar overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr
                  className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {['Sender', 'Profile', 'Status', 'Email', 'Phone', 'Tags', 'Date'].map((label) => (
                    <th key={label} className="px-5 py-3 font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="skeleton-shimmer h-4 rounded-md" style={{ width: '70px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : list.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <Inbox size={24} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-slate-400">No leads found</p>
                          <p className="mt-1 text-[12px] text-slate-600">No conversations with captured contact info yet</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.rows.map((row, index) => (
                    <tr
                      key={row._id}
                      className="transition-colors duration-150"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: index % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = index % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent'; }}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[12px] font-medium text-slate-300">{row.senderName || row.senderId}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] capitalize text-slate-400">{row.profileType || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-slate-400">{row.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {row.capturedData?.email ? (
                          <span className="text-[12px] font-medium text-emerald-400">{row.capturedData.email}</span>
                        ) : (
                          <span className="text-[12px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {row.capturedData?.phone ? (
                          <span className="text-[12px] font-medium text-amber-400">{row.capturedData.phone}</span>
                        ) : (
                          <span className="text-[12px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {row.tags.filter((t) => ['EMAIL_RECEIVED', 'PHONE_RECEIVED'].includes(t)).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                              style={
                                tag === 'EMAIL_RECEIVED'
                                  ? { background: 'rgba(16,185,129,0.12)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)' }
                                  : { background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }
                              }
                            >
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-[12px] text-slate-500">
                        {formatDate(row.createdAt)}
                      </td>
                    </tr>
                  ))
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
                        : { color: '#94A3B8' }
                    }
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
    </DashboardLayout>
  );
}
