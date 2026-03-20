import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ProjectHeader } from '../components/project/ProjectHeader';
import { BudgetCard } from '../components/project/BudgetCard';
import { SpendingTimeline } from '../components/project/SpendingTimeline';
import { RiskCard } from '../components/project/RiskCard';
import { FundReleaseTable } from '../components/project/FundReleaseTable';
import { ProofGallery } from '../components/project/ProofGallery';
import { FundReleaseModal } from '../components/forms/FundReleaseModal';
import { UpdateCompletionModal } from '../components/forms/UpdateCompletionModal';
import { CreateMilestoneModal } from '../components/forms/CreateMilestoneModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import {
  createMilestone,
  deleteProject,
  getMilestones,
  getProject,
  getProjectAuditLogs,
  getProofs,
  getProjectRisk,
  getReleaseRequests,
  getTransactions,
  releaseFunds,
  reviewReleaseRequest,
  updateProjectCompletion,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { usePolling } from '../hooks/usePolling';
import type { Analysis, AuditLog, FundReleaseRequest, Milestone, Project, Transaction, Proof } from '../types';
import { ChevronLeft, Flag, IndianRupee, Milestone as MilestoneIcon, ShieldCheck, Trash2, Upload } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [releaseRequests, setReleaseRequests] = useState<FundReleaseRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);

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

      let milestonesRes: Milestone[] = [];
      try {
        milestonesRes = await getMilestones(id);
      } catch {
        milestonesRes = [];
      }

      let requestsRes: FundReleaseRequest[] = [];
      let auditRes: AuditLog[] = [];
      if (role === 'government') {
        try {
          requestsRes = await getReleaseRequests(id);
        } catch {
          requestsRes = [];
        }
        try {
          auditRes = await getProjectAuditLogs(id);
        } catch {
          auditRes = [];
        }
      }

      setProject(projRes);
      setTransactions(txRes);
      setProofs(proofRes);
      setAnalysis(riskRes?.analysis || null);
      setMilestones(milestonesRes);
      setReleaseRequests(requestsRes);
      setAuditLogs(auditRes);
      setError(null);
    } catch {
      setError('Project not found');
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  usePolling(fetchData);

  const handleReleaseFunds = async (input: { amount: number; purpose: string; releaseDate: string }) => {
    if (!project) return;
    const latestMilestone = milestones.find((m) => {
      if (m.status === 'completed') return false;
      const milestoneReleased = releaseRequests
        .filter((r) => r.milestoneId === m.id && r.status === 'executed')
        .reduce((sum, r) => sum + r.amount, 0);
      const escrowRemaining = m.escrowAmount - milestoneReleased;
      return (
        project.completionPercentage >= m.requiredCompletionPercentage &&
        proofs.length >= m.requiredProofCount &&
        input.amount <= escrowRemaining
      );
    });

    if (milestones.length > 0 && !latestMilestone) {
      throw new Error('No eligible milestone available. Increase completion/proofs or use a lower release amount.');
    }

    const res = await releaseFunds(project.id, {
      ...input,
      milestoneId: latestMilestone?.id,
    });
    addToast('success', `Release request submitted for checker approval`);
    setReleaseRequests((prev) => [res.request, ...prev]);
    setProject(res.project);
    setFundModalOpen(false);
  };

  const handleCreateMilestone = async (input: {
    name: string;
    escrowAmount: number;
    requiredProofCount: number;
    requiredCompletionPercentage: number;
  }) => {
    if (!project) return;
    const milestone = await createMilestone(project.id, input);
    setMilestones((prev) => [...prev, milestone]);
    addToast('success', 'Milestone created');
    setMilestoneModalOpen(false);
  };

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!project) return;
    const reason = action === 'reject' ? window.prompt('Reason for rejection') || 'Rejected' : undefined;
    const res = await reviewReleaseRequest(project.id, requestId, action, reason);

    setReleaseRequests((prev) => prev.map((r) => (r.id === requestId ? res.request : r)));
    if (res.transaction && res.project) {
      setTransactions((prev) => [res.transaction!, ...prev]);
      setProject(res.project);
      addToast('success', 'Release request approved and executed');
    } else {
      addToast('success', action === 'approve' ? 'Request moved to next stage' : 'Request rejected');
    }
  };

  const handleUpdateCompletion = async (input: { completionPercentage: number }) => {
    if (!project) return;
    const updated = await updateProjectCompletion(project.id, input);
    setProject(updated);
    addToast('success', `Completion updated to ${updated.completionPercentage}%`);
    setCompletionModalOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    const confirmed = window.confirm(
      `Delete project ${project.name}? This will permanently remove related proofs and transactions.`
    );
    if (!confirmed) return;

    await deleteProject(project.id);
    addToast('success', 'Project deleted successfully');
    navigate('/');
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
              <>
                <Button icon={<IndianRupee size={16} />} onClick={() => setFundModalOpen(true)}>
                  Release Funds
                </Button>
                <Button variant="secondary" icon={<Flag size={16} />} onClick={() => setCompletionModalOpen(true)}>
                  Update Completion
                </Button>
                <Button variant="secondary" icon={<MilestoneIcon size={16} />} onClick={() => setMilestoneModalOpen(true)}>
                  Add Milestone
                </Button>
                <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDeleteProject}>
                  Delete Project
                </Button>
              </>
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

        {role === 'government' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card header={<h3 className="text-sm font-semibold">Milestones & Escrow</h3>}>
              {milestones.length === 0 ? (
                <p className="text-sm text-text-muted">No milestones yet. Add one to enforce escrow-based release rules.</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-text-primary">{milestone.name}</p>
                        <span className="text-xs text-text-secondary">{milestone.status}</span>
                      </div>
                      <p className="text-text-secondary mt-1">Escrow: ₹{(milestone.escrowAmount / 100).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-text-muted mt-1">
                        Rules: {milestone.requiredProofCount} proofs, {milestone.requiredCompletionPercentage}% completion
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card header={<h3 className="text-sm font-semibold">Fund Release Approvals</h3>}>
              {releaseRequests.length === 0 ? (
                <p className="text-sm text-text-muted">No release requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {releaseRequests.map((request) => (
                    <div key={request.id} className="rounded-lg border border-border p-3 text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-text-primary">₹{(request.amount / 100).toLocaleString('en-IN')}</p>
                        <span className="text-xs text-text-secondary">{request.status}</span>
                      </div>
                      <p className="text-text-secondary">{request.purpose}</p>
                      {request.milestone?.name && (
                        <p className="text-xs text-text-muted">Milestone: {request.milestone.name}</p>
                      )}
                      {(request.status === 'pending_checker' || request.status === 'pending_approver') && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={() => handleReviewRequest(request.id, 'approve')}>Approve</Button>
                          <Button size="sm" variant="secondary" onClick={() => handleReviewRequest(request.id, 'reject')}>Reject</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {role === 'government' && (
          <Card header={<h3 className="text-sm font-semibold inline-flex items-center gap-2"><ShieldCheck size={14} />Role Audit Trail</h3>}>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-text-muted">No audit events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.slice(0, 12).map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-3 border-b border-border/70 pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{log.action.replaceAll('_', ' ')}</p>
                      <p className="text-xs text-text-secondary">{log.actor?.displayName || 'System'} • {log.entityType}</p>
                    </div>
                    <span className="text-xs text-text-muted">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Fund Release Modal */}
        <FundReleaseModal
          project={project}
          isOpen={fundModalOpen}
          onClose={() => setFundModalOpen(false)}
          onSubmit={handleReleaseFunds}
        />

        <UpdateCompletionModal
          project={project}
          isOpen={completionModalOpen}
          onClose={() => setCompletionModalOpen(false)}
          onSubmit={handleUpdateCompletion}
        />

        <CreateMilestoneModal
          isOpen={milestoneModalOpen}
          onClose={() => setMilestoneModalOpen(false)}
          onSubmit={handleCreateMilestone}
        />
      </div>
    </PageLayout>
  );
}
