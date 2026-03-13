import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { FlaggedProjects } from '../components/dashboard/FlaggedProjects';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import { getDashboardAnalytics, getProjects, getRecentActivity } from '../services/api';
import { formatCurrencyShort } from '../utils/format';
import type { DashboardAnalytics, Project, ActivityItem } from '../types';
import { FolderKanban, IndianRupee, FileCheck, AlertTriangle, Upload } from 'lucide-react';

export default function AuthDashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [anRes, projRes, actRes] = await Promise.all([
        getDashboardAnalytics(),
        getProjects(1, 50),
        getRecentActivity(),
      ]);
      setAnalytics(anRes);
      setProjects(projRes.items);
      setActivities(actRes);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchData);

  if (loading) return <PageLayout><Spinner fullScreen /></PageLayout>;

  const isGovernment = role === 'government';
  const isContractor = role === 'contractor';
  const myProjects = isContractor ? projects.filter((p) => p.contractorId === user?.id) : projects;

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user?.displayName}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {isGovernment ? 'Government Dashboard' : 'Contractor Dashboard'}
          </p>
        </div>

        {/* Stats */}
        {analytics && (
          <div className={`grid gap-4 ${isGovernment ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <StatCard icon={<FolderKanban size={20} />} label={isContractor ? 'Assigned Projects' : 'Active Projects'} value={isContractor ? myProjects.length : analytics.activeProjects} />
            <StatCard icon={<IndianRupee size={20} />} label={isContractor ? 'Funds Received' : 'Total Budget'} value={formatCurrencyShort(isContractor ? myProjects.reduce((s, p) => s + p.fundsReleased, 0) : analytics.totalBudget)} />
            <StatCard icon={<FileCheck size={20} />} label="Proofs Uploaded" value={analytics.totalProofsUploaded} />
            {isGovernment && (
              <StatCard icon={<AlertTriangle size={20} />} label="Flagged Projects" value={analytics.flaggedProjects} />
            )}
          </div>
        )}

        {/* Government-specific */}
        {isGovernment && (
          <>
            <QuickActions />
            <RecentActivity activities={activities} />
            <FlaggedProjects projects={projects} />
          </>
        )}

        {/* Contractor-specific */}
        {isContractor && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Projects</h2>
            </div>
            {myProjects.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border p-8 text-center text-text-muted">
                No projects assigned yet. Contact your government administrator.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myProjects.map((p) => (
                  <div key={p.id} className="bg-surface rounded-xl border border-border p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <p className="text-xs text-text-muted">{p.location}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Budget: {formatCurrencyShort(p.totalBudget)}</span>
                      <span>Received: {formatCurrencyShort(p.fundsReleased)}</span>
                    </div>
                    <Button size="sm" icon={<Upload size={14} />} onClick={() => navigate(`/projects/${p.id}/proof`)}>
                      Upload Proof
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
