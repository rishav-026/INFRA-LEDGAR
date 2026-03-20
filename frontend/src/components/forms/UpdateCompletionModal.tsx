import { useState, type FormEvent } from 'react';
import type { CompletionUpdateInput, Project } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ApiError } from '../../services/api';

interface UpdateCompletionModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CompletionUpdateInput) => Promise<void>;
}

export function UpdateCompletionModal({ project, isOpen, onClose, onSubmit }: UpdateCompletionModalProps) {
  const [completion, setCompletion] = useState(String(project.completionPercentage || 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setCompletion(String(project.completionPercentage || 0));
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const setQuick = (value: number) => {
    setCompletion(String(value));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(completion);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError('Completion must be between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ completionPercentage: Math.round(value) });
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fieldErrors?.completionPercentage || err.message);
      } else {
        setError('Failed to update completion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Update Completion" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-secondary">
          Current completion: <strong className="text-text-primary">{project.completionPercentage}%</strong>
        </div>

        <Input
          label="Completion Percentage"
          type="number"
          min={0}
          max={100}
          required
          value={completion}
          onChange={(e) => {
            setCompletion(e.target.value);
            setError('');
          }}
          placeholder="0 to 100"
        />

        <div className="flex flex-wrap gap-2">
          {[0, 25, 50, 75, 100].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setQuick(value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border text-text-secondary hover:bg-surface"
            >
              {value}%
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Completion</Button>
        </div>
      </form>
    </Modal>
  );
}
