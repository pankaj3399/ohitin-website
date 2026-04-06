import { GitBranch } from 'lucide-react';
import type { FunnelMetrics } from '../types';
import { formatNumber } from '../utils/format';

interface FunnelAnalyticsProps {
  funnel: FunnelMetrics;
}

const stageConfig: Array<{
  key: keyof FunnelMetrics;
  label: string;
  color: string;
  bg: string;
}> = [
  { key: 'ACTIVE', label: 'Active', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  { key: 'WAITING_FOR_CONTACT', label: 'Waiting', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  { key: 'COMPLETED', label: 'Completed', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
];

export function FunnelAnalytics({ funnel }: FunnelAnalyticsProps) {
  const maxValue = Math.max(...stageConfig.map((stage) => funnel[stage.key]), 1);

  return (
    <section
      className="rounded-2xl border p-5"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <GitBranch size={14} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-slate-200">Funnel View</h2>
          <p className="text-[11px] text-slate-500">User progression stages</p>
        </div>
      </div>

      <div className="space-y-3">
        {stageConfig.map((stage, index) => {
          const value = funnel[stage.key];
          const percentage = Math.max((value / maxValue) * 100, 4);

          return (
            <div
              key={stage.key}
              className="group rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.02]"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                    style={{
                      background: stage.bg,
                      color: stage.color,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[12px] font-medium text-slate-300">
                    {stage.label}
                  </span>
                </div>
                <span className="text-[12px] font-semibold" style={{ color: stage.color }}>
                  {formatNumber(value)}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ background: stage.bg }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${stage.color}, ${stage.color}60)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
