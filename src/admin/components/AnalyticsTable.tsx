import { ChevronLeft, ChevronRight, Database, Download, Inbox, SlidersHorizontal } from 'lucide-react';
import type { AnalyticsRow, PaginationMeta } from '../types';
import { formatDate } from '../utils/format';

interface AnalyticsTableProps {
  rows: AnalyticsRow[];
  pagination: PaginationMeta;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  onExport: () => Promise<void>;
  isExporting: boolean;
}

/* ── Tag color map ── */
const tagColorMap: Record<string, { bg: string; text: string; border: string }> = {
  INVESTOR: { bg: 'rgba(139,92,246,0.12)', text: '#C4B5FD', border: 'rgba(139,92,246,0.2)' },
  CREATIVE: { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD', border: 'rgba(59,130,246,0.2)' },
  GENERAL: { bg: 'rgba(100,116,139,0.12)', text: '#94A3B8', border: 'rgba(100,116,139,0.2)' },
  VIP: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
  TALENT: { bg: 'rgba(236,72,153,0.12)', text: '#F9A8D4', border: 'rgba(236,72,153,0.2)' },
  BRAND: { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
};

const defaultTagColor = { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', border: 'rgba(100,116,139,0.15)' };

function getTagColor(tag: string) {
  return tagColorMap[tag.toUpperCase()] || defaultTagColor;
}

/* ── Status badge colors ── */
const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', dot: '#3B82F6' },
  WAITING_FOR_CONTACT: { bg: 'rgba(245,158,11,0.1)', text: '#FBBF24', dot: '#F59E0B' },
  COMPLETED: { bg: 'rgba(16,185,129,0.1)', text: '#34D399', dot: '#10B981' },
};

const defaultStatusColor = { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', dot: '#64748B' };

function getStatusColor(status: string) {
  return statusColorMap[status] || defaultStatusColor;
}

/* ── Profile type badge ── */
function getProfileBadge(type: string) {
  if (type === 'professional') {
    return { bg: 'rgba(139,92,246,0.1)', text: '#A78BFA', border: 'rgba(139,92,246,0.15)' };
  }
  return { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.15)' };
}

/* ── Skeleton row ── */
function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="skeleton-shimmer h-4 rounded-md"
            style={{
              width: i === 6 ? '100px' : i === 0 ? '80px' : '70px',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export function AnalyticsTable({
  rows,
  pagination,
  isLoading,
  onPageChange,
  onOpenFilters,
  activeFilterCount,
  onExport,
  isExporting,
}: AnalyticsTableProps) {
  const totalPages = Math.max(pagination.totalPages, 1);

  // Generate page numbers to display
  function getPageNumbers() {
    const pages: (number | 'ellipsis')[] = [];
    const current = pagination.page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('ellipsis');
      for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Table Header with Filter Trigger */}
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <Database size={14} className="text-slate-400" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-slate-200">Analytics Records</h2>
            <p className="text-[11px] text-slate-500">
              Page {pagination.page} of {totalPages}
            </p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Records count */}
          <div
            className="hidden rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400 sm:block"
            style={{ background: 'rgba(255, 255, 255, 0.04)' }}
          >
            {pagination.total} records
          </div>

          {/* Export button */}
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            type="button"
            onClick={() => void onExport()}
            disabled={isExporting}
          >
            <Download size={12} />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>

          {/* Filter trigger button */}
          <button
            type="button"
            onClick={onOpenFilters}
            className="relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium text-slate-400 transition-all duration-200 hover:border-blue-500/20 hover:bg-blue-500/5 hover:text-blue-400"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span
                className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-scrollbar overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr
              className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {[
                'User ID',
                'Profile',
                'Source',
                'Status',
                'Email',
                'Phone',
                'Tags',
                'Created',
              ].map((label) => (
                <th key={label} className="px-5 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(255, 255, 255, 0.04)' }}
                    >
                      <Inbox size={24} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-400">No records found</p>
                      <p className="mt-1 text-[12px] text-slate-600">
                        Try adjusting your filters to see more results
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const statusColor = getStatusColor(row.status);
                const profileBadge = getProfileBadge(row.profileType);

                return (
                  <tr
                    key={row._id}
                    className="group transition-colors duration-150"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      background: index % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent';
                    }}
                  >
                    <td className="px-5 py-3.5 text-[12px] font-medium text-slate-300">
                      <span className="font-mono" title={row._id}>
                        {row._id.slice(0, 10)}...
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize"
                        style={{
                          background: profileBadge.bg,
                          color: profileBadge.text,
                          border: `1px solid ${profileBadge.border}`,
                        }}
                      >
                        {row.profileType || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] capitalize text-slate-400">
                        {row.classificationSource}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          background: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: statusColor.dot }}
                        />
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
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {row.tags.length ? (
                          row.tags.map((tag) => {
                            const color = getTagColor(tag);
                            return (
                              <span
                                key={tag}
                                className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                                style={{
                                  background: color.bg,
                                  color: color.text,
                                  border: `1px solid ${color.border}`,
                                }}
                              >
                                {tag}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[12px] text-slate-600">—</span>
                        )}
                      </div>
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
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <p className="text-[12px] text-slate-500">
          Showing {rows.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </p>

        <div className="flex items-center gap-1">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
          >
            <ChevronLeft size={14} />
          </button>

          {getPageNumbers().map((page, i) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-[12px] text-slate-600">
                ...
              </span>
            ) : (
              <button
                key={page}
                className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg text-[12px] font-medium transition-all duration-200"
                style={
                  page === pagination.page
                    ? {
                      background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                      color: 'white',
                    }
                    : {
                      color: '#94A3B8',
                      border: '1px solid transparent',
                    }
                }
                onMouseEnter={(e) => {
                  if (page !== pagination.page) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== pagination.page) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                type="button"
                onClick={() => onPageChange(page)}
                disabled={isLoading}
              >
                {page}
              </button>
            )
          )}

          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
