import { Download, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect } from 'react';
import type { InstagramFilters } from '../types';

interface Props {
  filters: InstagramFilters;
  onChange: (key: keyof InstagramFilters, value: string | number) => void;
  onReset: () => void;
  onExport: () => Promise<void>;
  isExporting: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions = ['', 'ACTIVE', 'WAITING_FOR_CONTACT', 'COMPLETED'];
const profileTypeOptions = ['', 'professional', 'fan'];
const tagOptions = ['', 'EMAIL_RECEIVED', 'PHONE_RECEIVED', 'INVESTOR', 'CREATIVE', 'VIP', 'TALENT', 'BRAND', 'GENERAL'];

export function InstagramFiltersPanel({
  filters,
  onChange,
  onReset,
  onExport,
  isExporting,
  isOpen,
  onClose,
}: Props) {
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const activeCount = [
    filters.search,
    filters.status,
    filters.profileType,
    filters.tag,
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

      {/* Slide-over */}
      <div
        className={`admin-scrollbar fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'rgba(14, 18, 24, 0.97)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(24px)',
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
                background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))',
                border: '1px solid rgba(236,72,153,0.1)',
              }}
            >
              <SlidersHorizontal size={15} className="text-pink-400" />
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

        {/* Fields */}
        <div className="flex-1 space-y-5 px-6 py-6">
          {/* Search */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Search
            </label>
            <div className="relative group">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-pink-400"
              />
              <input
                className="admin-input !pl-10"
                value={filters.search}
                onChange={(e) => onChange('search', e.target.value)}
                placeholder="Sender ID, name, email..."
              />
            </div>
          </div>

          {/* Two-col */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                Status
              </label>
              <select
                className="admin-input admin-select"
                value={filters.status}
                onChange={(e) => onChange('status', e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt || 'all'} value={opt}>
                    {opt ? opt.replace(/_/g, ' ') : 'All Statuses'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                Profile Type
              </label>
              <select
                className="admin-input admin-select"
                value={filters.profileType}
                onChange={(e) => onChange('profileType', e.target.value)}
              >
                {profileTypeOptions.map((opt) => (
                  <option key={opt || 'all'} value={opt}>
                    {opt || 'All Types'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
              Tag
            </label>
            <select
              className="admin-input admin-select"
              value={filters.tag}
              onChange={(e) => onChange('tag', e.target.value)}
            >
              {tagOptions.map((opt) => (
                <option key={opt || 'all'} value={opt}>
                  {opt ? opt.replace(/_/g, ' ') : 'All Tags'}
                </option>
              ))}
            </select>
          </div>

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
                onChange={(e) => onChange('startDate', e.target.value)}
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
                onChange={(e) => onChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 border-t px-6 py-4"
          style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
        >
          <button
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-medium text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            type="button"
            onClick={onReset}
          >
            <RotateCcw size={13} />
            Reset All
          </button>
          <button
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' }}
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
