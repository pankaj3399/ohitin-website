import { useCallback, useEffect, useState } from 'react';
import {
  exportAnalyticsCsv,
  fetchDashboardData,
  getApiErrorMessage,
} from '../api/admin';
import { useAdminAuth } from '../auth/AuthContext';
import { AnalyticsTable } from '../components/AnalyticsTable';
import { DashboardLayout } from '../components/DashboardLayout';
import { FiltersPanel } from '../components/FiltersPanel';
import { OverviewCards } from '../components/OverviewCards';
import type {
  AdminDashboardData,
  AnalyticsFilters,
  AnalyticsListResponse,
  OverviewMetrics,
} from '../types';
import { downloadBlob } from '../utils/format';
import { AlertCircle } from 'lucide-react';

const defaultOverview: OverviewMetrics = {
  totalUsers: 0,
  totalProfessionals: 0,
  totalFans: 0,
  emailsCollected: 0,
  phonesCollected: 0,
};

const defaultAnalytics: AnalyticsListResponse = {
  rows: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const initialFilters: AnalyticsFilters = {
  page: 1,
  limit: 10,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  profileType: '',
  classificationSource: '',
  status: '',
  startDate: '',
  endDate: '',
};

export default function AdminDashboardPage() {
  const { refreshAdmin, logout } = useAdminAuth();
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [overview, setOverview] = useState<OverviewMetrics>(defaultOverview);
  const [analytics, setAnalytics] = useState<AnalyticsListResponse>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.profileType,
    filters.classificationSource,
    filters.status,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const admin = await refreshAdmin();

        if (!admin || !isMounted) {
          return;
        }

        const data: AdminDashboardData = await fetchDashboardData(filters);

        if (!isMounted) {
          return;
        }

        setOverview(data.overview);
        setAnalytics(data.analytics);
      } catch (dashboardError) {
        const message = getApiErrorMessage(
          dashboardError,
          'Unable to load dashboard data.'
        );

        if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('401')) {
          logout();
          return;
        }

        if (isMounted) {
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [filters, logout, refreshAdmin]);

  function handleFilterChange(key: keyof AnalyticsFilters, value: string | number) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? Number(value) : 1,
    }));
  }

  function handleReset() {
    setFilters(initialFilters);
  }

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const csvBlob = await exportAnalyticsCsv(filters);
      downloadBlob(csvBlob, `admin-analytics-page-${filters.page}.csv`);
    } catch (exportError) {
      setError(getApiErrorMessage(exportError, 'Unable to export CSV.'));
    } finally {
      setIsExporting(false);
    }
  }, [filters]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="animate-[fadeInUp_0.5s_ease-out]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Analytics Overview
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
                Monitor user intake, contact capture, tag distribution, and funnel
                progression from your internal workspace.
              </p>
            </div>

            {/* Live indicator */}
            <div
              className="flex items-center gap-2 self-start rounded-lg px-3 py-1.5 lg:self-auto"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.12)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-emerald-400">Live data</span>
            </div>
          </div>
        </section>

        {/* Error */}
        {error ? (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 text-[13px]"
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.12)',
              color: '#FCA5A5',
            }}
          >
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            {error}
          </div>
        ) : null}

        {/* Stats Cards */}
        <OverviewCards overview={overview} />

        {/* Table — filter trigger is built into the table header */}
        <AnalyticsTable
          rows={analytics.rows}
          pagination={analytics.pagination}
          isLoading={isLoading}
          onPageChange={(page) => handleFilterChange('page', page)}
          onOpenFilters={() => setIsFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </div>

      {/* Filter slide-over modal */}
      <FiltersPanel
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
