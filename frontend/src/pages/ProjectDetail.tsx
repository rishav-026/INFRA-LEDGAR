import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ProjectHeader } from '../components/project/ProjectHeader';
import { BudgetCard } from '../components/project/BudgetCard';
import { SpendingTimeline } from '../components/project/SpendingTimeline';
import { RiskCard } from '../components/project/RiskCard';
import { FundReleaseTable } from '../components/project/FundReleaseTable';
import { ProofGallery } from '../components/project/ProofGallery';
import { FundReleaseModal } from '../components/forms/FundReleaseModal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { getProject, getTransactions, getProofs, getProjectRisk, releaseFunds } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { usePolling } from '../hooks/usePolling';
import type { Analysis, Project, Transaction, Proof } from '../types';
import { ChevronLeft, IndianRupee, Upload } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { addToast } = useToastContext();

  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundModalOpen, setFundModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [projRes, txRes, proofRes] = await Promise.all([
        getProject(id),
        getTransactions(id),
        getProofs(id),
      ]);

      let riskRes: { project: Project; analysis: Analysis } | null = null;
      try {
        riskRes = await getProjectRisk(id);
      } catch {
        riskRes = null;
      }

      setProject(projRes);
      setTransactions(txRes);
      setProofs(proofRes);
      setAnalysis(riskRes?.analysis || null);
      setError(null);
    } catch {
      setError('Project not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  usePolling(fetchData);

  const handleReleaseFunds = async (input: { amount: number; purpose: string; releaseDate: string }) => {
    if (!project) return;
    const res = await releaseFunds(project.id, input);
    addToast('success', `₹${(input.amount / 100).toLocaleString('en-IN')} released successfully`);
    setTransactions((prev) => [res.transaction, ...prev]);
    setProject(res.project);
    setFundModalOpen(false);
  };

  if (loading) return <PageLayout><Spinner fullScreen /></PageLayout>;

  if (error || !project) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-text-secondary mb-4">The project you're looking for doesn't exist.</p>
          <Link to="/" className="text-brand-600 hover:underline">← Back to Dashboard</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
          <ChevronLeft size={16} /> Projects
        </Link>

        <ProjectHeader project={project} />

        {/* Action buttons */}
        {(role === 'government' || role === 'contractor') && (
          <div className="flex gap-3">
            {role === 'government' && (
              <Button icon={<IndianRupee size={16} />} onClick={() => setFundModalOpen(true)}>
                Release Funds
              </Button>
            )}
            {role === 'contractor' && (
              <Link to={`/projects/${id}/proof`}>
                <Button icon={<Upload size={16} />}>Upload Proof</Button>
              </Link>
            )}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <BudgetCard project={project} />
            <SpendingTimeline transactions={transactions} />
            <FundReleaseTable transactions={transactions} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <RiskCard
              project={project}
              features={analysis?.features || null}
              analysis={analysis}
            />
          </div>
        </div>

        <ProofGallery proofs={proofs} />

        {/* Fund Release Modal */}
        <FundReleaseModal
          project={project}
          isOpen={fundModalOpen}
          onClose={() => setFundModalOpen(false)}
          onSubmit={handleReleaseFunds}
        />
      </div>
    </PageLayout>
  );
}
