import { useState, useCallback, useMemo } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { HeroBanner } from '../components/dashboard/HeroBanner';
import { FilterBar } from '../components/project/FilterBar';
import { ProjectList } from '../components/project/ProjectList';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { SkeletonCard } from '../components/ui/Skeleton';
import { getProjects, getDashboardAnalytics } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import type { Project, DashboardAnalytics, ProjectStatus } from '../types';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { Building } from 'lucide-react';
import { formatTimeAgo } from '../utils/format';

export default function PublicDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const fetchData = useCallback(async () => {
    try {
      const [projRes, analyRes] = await Promise.all([
        getProjects(page, DEFAULT_PAGE_SIZE),
        getDashboardAnalytics(),
      ]);
      setProjects(projRes.items);
      setTotal(projRes.total);
      setAnalytics(analyRes);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch {
      setError('Unable to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  usePolling(fetchData);

  // Client-side filtering
  const filtered = useMemo(() => {
    let result = projects;
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [projects, statusFilter, searchQuery]);

  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);

  return (
    <PageLayout>
      <div className="space-y-6">
        <HeroBanner analytics={analytics} />

        <div className="flex items-center justify-between">
          <FilterBar
            onSearch={setSearchQuery}
            onStatusFilter={setStatusFilter}
            currentStatus={statusFilter}
          />
          <span className="text-xs text-text-muted hidden sm:block whitespace-nowrap ml-4">
            Updated {formatTimeAgo(lastUpdated)}
          </span>
        </div>

        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building size={48} strokeWidth={1} />}
            title="No projects tracked yet"
            description="Infrastructure projects will appear here once registered."
          />
        ) : (
          <>
            <ProjectList projects={filtered} />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </PageLayout>
  );
}
