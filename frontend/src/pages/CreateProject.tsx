import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { CreateProjectForm } from '../components/forms/CreateProjectForm';
import { useToastContext } from '../context/ToastContext';
import { createProject } from '../services/api';
import type { CreateProjectInput } from '../types';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateProject() {
  const navigate = useNavigate();
  const { addToast } = useToastContext();

  const handleSubmit = async (input: CreateProjectInput) => {
    const res = await createProject(input);
    addToast('success', 'Project created successfully');
    navigate(`/project/${res.id}`);
  };

  return (
    <PageLayout maxWidth="max-w-3xl">
      <div className="space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="text-xl font-bold text-text-primary">Create New Project</h1>

        <CreateProjectForm onSubmit={handleSubmit} />
      </div>
    </PageLayout>
  );
}
