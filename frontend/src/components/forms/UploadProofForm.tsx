import { useState, type FormEvent } from 'react';
import { DropZone } from '../ui/DropZone';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { CheckCircle, Upload } from 'lucide-react';
import { ApiError } from '../../services/api';

interface UploadProofFormProps {
  projectName: string;
  onSubmit: (files: File[], description: string) => Promise<{ ipfsHash: string; blockchainTxHash?: string }>;
}

type Stage = 'form' | 'uploading' | 'success';

export function UploadProofForm({ projectName, onSubmit }: UploadProofFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [result, setResult] = useState<{ ipfsHash: string; blockchainTxHash?: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { setError('Add at least one file'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    setError('');
    setFieldError('');
    setStage('uploading');
    try {
      const res = await onSubmit(files, description.trim());
      setResult(res);
      setStage('success');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldError(err.fieldErrors?.description || err.fieldErrors?.file || '');
      } else {
        setError('Upload failed. Please try again.');
      }
      setStage('form');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setDescription('');
    setStage('form');
    setResult(null);
    setError('');
    setFieldError('');
  };

  if (stage === 'success' && result) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800">{files.length} file{files.length > 1 ? 's' : ''} uploaded successfully</h3>
          <p className="text-sm text-green-700 mt-2 font-mono break-all">IPFS CID: {result.ipfsHash}</p>
          {result.blockchainTxHash && (
            <p className="text-xs text-green-700 mt-1 font-mono break-all">Tx: {result.blockchainTxHash}</p>
          )}
          <p className="text-xs text-green-600 mt-1">Recorded on blockchain</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.history.back()}>View in Project</Button>
          <Button variant="primary" icon={<Upload size={16} />} onClick={handleReset}>Upload More</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <p className="text-sm text-text-secondary">
        Project: <strong>{projectName}</strong>
      </p>

      <DropZone files={files} onFilesChange={setFiles} />

      <Textarea
        label="Description"
        required
        placeholder="e.g. Week 3: 200m road base laid"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        charCount={{ current: description.length, max: 500 }}
        error={fieldError || undefined}
      />

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancel</Button>
        <Button
          type="submit"
          loading={stage === 'uploading'}
          disabled={files.length === 0}
          icon={<Upload size={16} />}
        >
          {stage === 'uploading' ? 'Uploading...' : 'Upload Proof →'}
        </Button>
      </div>
    </form>
  );
}
