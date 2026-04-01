import { BarChart3, Mail, Phone, TrendingUp, Users, UserSquare2 } from 'lucide-react';
import type { OverviewMetrics } from '../types';
import { formatNumber } from '../utils/format';

const overviewItems = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    icon: Users,
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#60A5FA',
    borderColor: 'rgba(59,130,246,0.1)',
    trend: '+12%',
    trendUp: true,
  },
  {
    key: 'totalProfessionals',
    label: 'Professionals',
    icon: UserSquare2,
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
    iconBg: 'rgba(139,92,246,0.12)',
    iconColor: '#A78BFA',
    borderColor: 'rgba(139,92,246,0.1)',
    trend: '+8%',
    trendUp: true,
  },
  {
    key: 'totalFans',
    label: 'Total Fans',
    icon: BarChart3,
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
    iconBg: 'rgba(6,182,212,0.12)',
    iconColor: '#22D3EE',
    borderColor: 'rgba(6,182,212,0.1)',
    trend: '+24%',
    trendUp: true,
  },
  {
    key: 'emailsCollected',
    label: 'Emails Collected',
    icon: Mail,
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#34D399',
    borderColor: 'rgba(16,185,129,0.1)',
    trend: '+18%',
    trendUp: true,
  },
  {
    key: 'phonesCollected',
    label: 'Phones Collected',
    icon: Phone,
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#FBBF24',
    borderColor: 'rgba(245,158,11,0.1)',
    trend: '+5%',
    trendUp: true,
  },
] as const;

interface OverviewCardsProps {
  overview: OverviewMetrics;
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  return (
    <section className="stagger-fade grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {overviewItems.map((item) => {
        const Icon = item.icon;
        const value = overview[item.key];

        return (
          <article
            key={item.key}
            className="group cursor-default rounded-2xl border p-5 transition-all duration-300"
            style={{
              background: item.gradient,
              borderColor: item.borderColor,
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: item.iconBg }}
              >
                <Icon size={18} style={{ color: item.iconColor }} />
              </div>
              <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: item.trendUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: item.trendUp ? '#34D399' : '#F87171',
                }}
              >
                <TrendingUp size={10} />
                {item.trend}
              </div>
            </div>
            <p className="text-[12px] font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {formatNumber(value)}
            </p>
          </article>
        );
      })}
    </section>
  );
}
