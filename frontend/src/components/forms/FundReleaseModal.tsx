import { useState, type FormEvent } from 'react';
import type { Project, ReleaseFundInput } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { formatCurrency, percentage } from '../../utils/format';
import { AlertTriangle } from 'lucide-react';
import { ApiError } from '../../services/api';

interface FundReleaseModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ReleaseFundInput) => Promise<void>;
}

type Step = 'form' | 'confirm';

export function FundReleaseModal({ project, isOpen, onClose, onSubmit }: FundReleaseModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const remaining = project.totalBudget - project.fundsReleased;
  const amountPaise = Math.round(Number(amount) * 100);
  const pct = percentage(project.fundsReleased, project.totalBudget);

  const reset = () => {
    setStep('form');
    setAmount('');
    setPurpose('');
    setError('');
    setFieldErrors({});
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (!amount || Number(amount) <= 0) { setError('Amount must be positive'); return; }
    if (amountPaise > remaining) { setError(`Exceeds remaining budget of ${formatCurrency(remaining)}`); return; }
    if (!purpose.trim()) { setError('Purpose is required'); return; }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSubmit({ amount: amountPaise, purpose: purpose.trim(), releaseDate: new Date(releaseDate).toISOString() });
      handleClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors || {});
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Transaction failed. Please try again.');
      }
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Release Funds">
      {/* Project summary */}
      <div className="bg-surface-secondary rounded-lg p-3 mb-5 space-y-1 text-sm">
        <p className="font-medium text-text-primary">{project.name}</p>
        <div className="flex justify-between text-text-secondary">
          <span>Budget: {formatCurrency(project.totalBudget)}</span>
          <span>Released: {formatCurrency(project.fundsReleased)} ({pct}%)</span>
        </div>
        <p className="text-text-muted">Remaining: {formatCurrency(remaining)}</p>
      </div>

      {step === 'form' ? (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Amount (₹)"
            required
            type="number"
            placeholder="e.g. 5000000"
            min={1}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            error={fieldErrors.amount}
          />
          <p className="text-xs text-text-muted -mt-2">Max: {formatCurrency(remaining)}</p>

          <Textarea
            label="Purpose"
            required
            placeholder="e.g. Foundation work completed"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            charCount={{ current: purpose.length, max: 500 }}
            error={fieldErrors.purpose}
          />

          <Input
            label="Date"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You are about to release {formatCurrency(amountPaise)}
                </p>
                <p className="text-sm text-yellow-700 mt-1">for "{purpose}"</p>
                <p className="text-xs text-yellow-600 mt-2">
                  This action is recorded on blockchain and cannot be reversed.
                </p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep('form')}>Back</Button>
            <Button variant="danger" loading={loading} onClick={handleConfirm}>
              Confirm Release
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
