import { Download, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect } from 'react';
import type { AnalyticsFilters } from '../types';

interface FiltersPanelProps {
  filters: AnalyticsFilters;
  onChange: (key: keyof AnalyticsFilters, value: string | number) => void;
  onReset: () => void;
  onExport: () => Promise<void>;
  isExporting: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions = [
  '',
  'ACTIVE',
  'WAITING_FOR_CONTACT',
  'COMPLETED',
];

const profileTypeOptions = ['', 'professional', 'fan'];
const classificationSourceOptions = ['', 'keyword', 'gemini'];

export function FiltersPanel({
  filters,
  onChange,
  onReset,
  onExport,
  isExporting,
  isOpen,
  onClose,
}: FiltersPanelProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Count active filters
  const activeCount = [
    filters.search,
    filters.profileType,
    filters.classificationSource,
    filters.status,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`admin-scrollbar fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'rgba(14, 18, 24, 0.97)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '-16px 0 64px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
                border: '1px solid rgba(59,130,246,0.1)',
              }}
            >
              <SlidersHorizontal size={15} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Filters</h2>
              {activeCount > 0 && (
                <p className="text-[11px] text-slate-500">
                  {activeCount} filter{activeCount > 1 ? 's' : ''} active
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter fields */}
        <div className="flex-1 space-y-5 px-6 py-6">
          {/* Search */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Search
            </label>
            <div className="relative group">
              <Search 
                size={14} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" 
              />
              <input
                className="admin-input !pl-10"
                value={filters.search}
                onChange={(event) => onChange('search', event.target.value)}
                placeholder="User, email, phone..."
              />
            </div>
          </div>

          {/* Two-col grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Profile Type */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                Profile Type
              </label>
              <select
                className="admin-input admin-select"
                value={filters.profileType}
                onChange={(event) => onChange('profileType', event.target.value)}
              >
                {profileTypeOptions.map((option) => (
                  <option key={option || 'all'} value={option}>
                    {option || 'All Types'}
                  </option>
                ))}
              </select>
            </div>

            {/* Classification Source */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                Source
              </label>
              <select
                className="admin-input admin-select"
                value={filters.classificationSource}
                onChange={(event) => onChange('classificationSource', event.target.value)}
              >
                {classificationSourceOptions.map((option) => (
                  <option key={option || 'all'} value={option}>
                    {option || 'All Sources'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status full width */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Status
            </label>
            <select
              className="admin-input admin-select"
              value={filters.status}
              onChange={(event) => onChange('status', event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option || 'all'} value={option}>
                  {option ? option.replace(/_/g, ' ') : 'All Statuses'}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                Start Date
              </label>
              <input
                className="admin-input"
                type="date"
                value={filters.startDate}
                onChange={(event) => onChange('startDate', event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                End Date
              </label>
              <input
                className="admin-input"
                type="date"
                value={filters.endDate}
                onChange={(event) => onChange('endDate', event.target.value)}
              />
            </div>
          </div>


        </div>

        {/* Footer actions — pinned to bottom */}
        <div
          className="flex items-center gap-3 border-t px-6 py-4"
          style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
        >
          <button
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-medium text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            type="button"
            onClick={() => {
              onReset();
            }}
          >
            <RotateCcw size={13} />
            Reset All
          </button>
          <button
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            }}
            type="button"
            onClick={() => void onExport()}
            disabled={isExporting}
          >
            <Download size={13} />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </>
  );
}
