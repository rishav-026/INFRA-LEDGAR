import { useState, useEffect, type FormEvent } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { ApiError, getContractors } from '../../services/api';
import type { User, CreateProjectInput } from '../../types';

interface CreateProjectFormProps {
  onSubmit: (input: CreateProjectInput) => Promise<void>;
}

export function CreateProjectForm({ onSubmit }: CreateProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractors, setContractors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    getContractors().then((res) => setContractors(res));
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Project name is required';
    if (name.length > 200) e.name = 'Max 200 characters';
    if (!budget || Number(budget) <= 0) e.budget = 'Budget must be a positive number';
    if (!location.trim()) e.location = 'Location is required';
    if (location.length > 300) e.location = 'Max 300 characters';
    if (!contractorId) e.contractorId = 'Select a contractor';
    if (!startDate) e.startDate = 'Start date is required';
    if (!endDate) e.endDate = 'End date is required';
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      e.endDate = 'End date must be after start date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormError('');
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        totalBudget: Math.round(Number(budget) * 100), // Convert ₹ to paise
        location: location.trim(),
        contractorId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
        }
        setFormError(error.message);
      } else {
        setFormError('Unable to create project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <Input
        label="Project Name"
        required
        placeholder="e.g. NH-44 Bypass Road Construction"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        charCount={{ current: name.length, max: 200 }}
      />

      <Textarea
        label="Description"
        placeholder="Brief description of the project..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <Input
        label="Total Budget (₹)"
        required
        type="number"
        placeholder="e.g. 50000000"
        min={1}
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        error={errors.budget}
      />

      <Input
        label="Location"
        required
        placeholder="e.g. Yelahanka, Karnataka"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        error={errors.location}
        charCount={{ current: location.length, max: 300 }}
      />

      <Select
        label="Assigned Contractor"
        required
        placeholder="Select contractor"
        value={contractorId}
        onChange={(e) => setContractorId(e.target.value)}
        options={contractors.map((c) => ({ value: c.id, label: `${c.displayName} (${c.organization || c.email})` }))}
        error={errors.contractorId}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={errors.startDate}
        />
        <Input
          label="End Date"
          required
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={errors.endDate}
        />
      </div>

      {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Project →
        </Button>
      </div>
    </form>
  );
}
