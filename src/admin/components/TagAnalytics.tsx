import { Tag } from 'lucide-react';
import type { TagCount } from '../types';
import { formatNumber } from '../utils/format';

interface TagAnalyticsProps {
  tags: TagCount[];
}

const tagBarColors: Record<string, { bar: string; bg: string }> = {
  INVESTOR: { bar: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  CREATIVE: { bar: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
  GENERAL: { bar: '#64748B', bg: 'rgba(100,116,139,0.08)' },
  VIP: { bar: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  TALENT: { bar: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
  BRAND: { bar: '#10B981', bg: 'rgba(16,185,129,0.08)' },
};

const defaultBarColor = { bar: '#64748B', bg: 'rgba(100,116,139,0.08)' };

export function TagAnalytics({ tags }: TagAnalyticsProps) {
  const maxCount = Math.max(...tags.map((item) => item.count), 1);

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
          <Tag size={14} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-slate-200">Tag Distribution</h2>
          <p className="text-[11px] text-slate-500">Tag distribution across records</p>
        </div>
      </div>

      <div className="space-y-3">
        {tags.length ? (
          tags.map((item) => {
            const colors = tagBarColors[item.tag.toUpperCase()] || defaultBarColor;
            const percentage = Math.max((item.count / maxCount) * 100, 6);

            return (
              <div
                key={item.tag}
                className="group rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.02]"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: colors.bar }}
                    />
                    <span className="text-[12px] font-medium text-slate-300">
                      {item.tag}
                    </span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-400">
                    {formatNumber(item.count)}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: colors.bg }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${colors.bar}, ${colors.bar}80)`,
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <Tag size={20} className="text-slate-600" />
            <p className="text-[12px] text-slate-500">No tag data available</p>
          </div>
        )}
      </div>
    </section>
  );
}
