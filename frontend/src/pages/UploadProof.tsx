import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { UploadProofForm } from '../components/forms/UploadProofForm';
import { Spinner } from '../components/ui/Spinner';
import { useToastContext } from '../context/ToastContext';
import { getProject, uploadProof } from '../services/api';
import type { Project } from '../types';
import { ChevronLeft } from 'lucide-react';

export default function UploadProofPage() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToastContext();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProject(id)
      .then((res) => setProject(res))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (files: File[], description: string) => {
    if (!project) throw new Error('No project');
    const res = await uploadProof(project.id, files, description);
    addToast('success', 'Work proof uploaded successfully');
    return { ipfsHash: res.ipfsHash, blockchainTxHash: res.blockchainTxHash };
  };

  if (loading) return <PageLayout><Spinner fullScreen /></PageLayout>;
  if (!project) return <PageLayout><div className="text-center py-20">Project not found</div></PageLayout>;

  return (
    <PageLayout maxWidth="max-w-3xl">
      <div className="space-y-6">
        <Link to={`/project/${id}`} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
          <ChevronLeft size={16} /> Back to Project
        </Link>

        <h1 className="text-xl font-bold text-text-primary">Upload Work Proof</h1>

        <UploadProofForm projectName={project.name} onSubmit={handleSubmit} />
      </div>
    </PageLayout>
  );
}
