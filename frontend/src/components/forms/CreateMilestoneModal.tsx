import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ApiError } from '../../services/api';

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    escrowAmount: number;
    requiredProofCount: number;
    requiredCompletionPercentage: number;
  }) => Promise<void>;
}

export function CreateMilestoneModal({ isOpen, onClose, onSubmit }: CreateMilestoneModalProps) {
  const [name, setName] = useState('');
  const [escrowAmountRupees, setEscrowAmountRupees] = useState('');
  const [requiredProofCount, setRequiredProofCount] = useState('1');
  const [requiredCompletionPercentage, setRequiredCompletionPercentage] = useState('25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setEscrowAmountRupees('');
    setRequiredProofCount('1');
    setRequiredCompletionPercentage('25');
    setLoading(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const escrow = Number(escrowAmountRupees);
    const proof = Number(requiredProofCount);
    const completion = Number(requiredCompletionPercentage);

    if (!name.trim()) {
      setError('Milestone name is required');
      return;
    }
    if (!Number.isFinite(escrow) || escrow <= 0) {
      setError('Escrow amount must be a positive number');
      return;
    }
    if (!Number.isFinite(proof) || proof < 0) {
      setError('Required proof count must be zero or more');
      return;
    }
    if (!Number.isFinite(completion) || completion < 0 || completion > 100) {
      setError('Required completion must be between 0 and 100');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        escrowAmount: Math.round(escrow * 100),
        requiredProofCount: Math.round(proof),
        requiredCompletionPercentage: Math.round(completion),
      });
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create milestone');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Milestone">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Milestone Name"
          required
          placeholder="Foundation Completion"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Escrow Amount (INR)"
          required
          type="number"
          min={1}
          value={escrowAmountRupees}
          onChange={(e) => setEscrowAmountRupees(e.target.value)}
        />
        <Input
          label="Required Proof Count"
          required
          type="number"
          min={0}
          value={requiredProofCount}
          onChange={(e) => setRequiredProofCount(e.target.value)}
        />
        <Input
          label="Required Completion (%)"
          required
          type="number"
          min={0}
          max={100}
          value={requiredCompletionPercentage}
          onChange={(e) => setRequiredCompletionPercentage(e.target.value)}
        />

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Milestone</Button>
        </div>
      </form>
    </Modal>
  );
}
