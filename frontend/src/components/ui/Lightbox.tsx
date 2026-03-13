import { X, ExternalLink } from 'lucide-react';
import type { Proof } from '../../types';
import { IPFS_GATEWAY } from '../../constants';
import { formatDate } from '../../utils/format';

interface LightboxProps {
  proof: Proof | null;
  onClose: () => void;
}

export function Lightbox({ proof, onClose }: LightboxProps) {
  if (!proof) return null;

  const isImage = proof.fileType.startsWith('image/');
  const ipfsUrl = `${IPFS_GATEWAY}${proof.ipfsHash}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-medium truncate pr-4">{proof.fileName}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center bg-gray-900 min-h-[300px] max-h-[60vh] overflow-auto">
          {isImage ? (
            <img
              src={ipfsUrl}
              alt={proof.description}
              className="max-w-full max-h-[60vh] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" fill="%2394a3b8" font-size="14">Image unavailable</text></svg>';
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
              <p className="text-sm">Preview not available for this file type</p>
              <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-400 hover:underline flex items-center gap-1">
                Open file <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="px-5 py-4 space-y-2 border-t border-border">
          <p className="text-sm text-text-secondary">{proof.description}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
            <span>Uploaded: {formatDate(proof.createdAt)}</span>
            <span className="font-mono">CID: {proof.ipfsHash}</span>
          </div>
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
          >
            Verify on IPFS <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
