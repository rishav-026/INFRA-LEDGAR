import type { DashboardAnalytics } from '../../types';
import { formatCurrencyShort } from '../../utils/format';
import { IndianRupee, FileCheck, FolderKanban } from 'lucide-react';

interface HeroBannerProps {
  analytics: DashboardAnalytics | null;
}

export function HeroBanner({ analytics }: HeroBannerProps) {
  return (
    <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 sm:p-8 text-white">
      <h1 className="text-2xl sm:text-3xl font-bold">Track Public Infrastructure Spending</h1>
      <p className="text-brand-100 mt-2 text-sm sm:text-base max-w-xl">
        Every rupee. Verified on blockchain. Transparent to all citizens.
      </p>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { icon: <FolderKanban size={18} />, label: 'Total Projects', value: analytics.totalProjects },
            { icon: <IndianRupee size={18} />, label: 'Total Budget', value: formatCurrencyShort(analytics.totalBudget) },
            { icon: <IndianRupee size={18} />, label: 'Funds Released', value: formatCurrencyShort(analytics.totalFundsReleased) },
            { icon: <FileCheck size={18} />, label: 'Proofs Uploaded', value: analytics.totalProofsUploaded },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
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
