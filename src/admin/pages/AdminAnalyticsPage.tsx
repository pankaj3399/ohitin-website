import { useEffect, useState } from 'react';
import { fetchFunnel, fetchTags, getApiErrorMessage } from '../api/admin';
import { useAdminAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { FunnelAnalytics } from '../components/FunnelAnalytics';
import { TagAnalytics } from '../components/TagAnalytics';
import type { FunnelMetrics, TagCount } from '../types';
import { AlertCircle, Loader2 } from 'lucide-react';

const defaultFunnel: FunnelMetrics = {
  ACTIVE: 0,
  WAITING_FOR_CONTACT: 0,
  COMPLETED: 0,
};

export default function AdminAnalyticsPage() {
  const { refreshAdmin, logout } = useAdminAuth();
  const [tags, setTags] = useState<TagCount[]>([]);
  const [funnel, setFunnel] = useState<FunnelMetrics>(defaultFunnel);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const admin = await refreshAdmin();

        if (!admin || !isMounted) {
          return;
        }

        const [tagsData, funnelData] = await Promise.all([
          fetchTags(),
          fetchFunnel(),
        ]);

        if (!isMounted) {
          return;
        }

        setTags(tagsData);
        setFunnel(funnelData);
      } catch (analyticsError) {
        const message = getApiErrorMessage(
          analyticsError,
          'Unable to load analytics data.'
        );

        if (
          message.toLowerCase().includes('unauthorized') ||
          message.toLowerCase().includes('401')
        ) {
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

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [logout, refreshAdmin]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="animate-[fadeInUp_0.5s_ease-out]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Analytics
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Tag & Funnel Insights
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
                Dive deeper into your captured audience segments and conversion stages.
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

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-slate-500" size={24} />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr] animate-[fadeInUp_0.6s_ease-out]">
            <TagAnalytics tags={tags} />
            <FunnelAnalytics funnel={funnel} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
