import type { DashboardAnalytics } from '../../types';
import { formatCurrencyShort } from '../../utils/format';
import { IndianRupee, FileCheck, FolderKanban } from 'lucide-react';

interface HeroBannerProps {
  analytics: DashboardAnalytics | null;
}

export function HeroBanner({ analytics }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-brand-700 to-brand-600 rounded-2xl p-6 sm:p-8 text-white shadow-[0_18px_45px_rgba(30,64,175,0.28)]">
      <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 left-12 w-44 h-44 rounded-full bg-emerald-300/20 blur-2xl" />

      <h1 className="relative text-2xl sm:text-3xl font-bold tracking-tight">Track Public Infrastructure Spending</h1>
      <p className="relative text-brand-100 mt-2 text-sm sm:text-base max-w-xl">
        Every rupee. Verified on blockchain. Transparent to all citizens.
      </p>

      {analytics && (
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { icon: <FolderKanban size={18} />, label: 'Total Projects', value: analytics.totalProjects },
            { icon: <IndianRupee size={18} />, label: 'Total Budget', value: formatCurrencyShort(analytics.totalBudget) },
            { icon: <IndianRupee size={18} />, label: 'Funds Released', value: formatCurrencyShort(analytics.totalFundsReleased) },
            { icon: <FileCheck size={18} />, label: 'Proofs Uploaded', value: analytics.totalProofsUploaded },
          ].map((stat, i) => (
            <div key={i} className="bg-white/12 border border-white/20 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-brand-200 mb-1">
                {stat.icon}
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
