import { useState } from 'react';
import type { Proof } from '../../types';
import { Card } from '../ui/Card';
import { Lightbox } from '../ui/Lightbox';
import { IPFS_GATEWAY } from '../../constants';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { formatDate } from '../../utils/format';

interface ProofGalleryProps {
  proofs: Proof[];
}

export function ProofGallery({ proofs }: ProofGalleryProps) {
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);

  return (
    <>
      <Card header={<h3 className="text-sm font-semibold">Work Proof ({proofs.length} files)</h3>}>
        {proofs.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-sm text-text-muted">
            <ImageIcon size={32} strokeWidth={1} className="mb-2" />
            No work proof uploaded.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {proofs.map((proof) => {
              const isImage = proof.fileType.startsWith('image/');
              return (
                <button
                  key={proof.id}
                  onClick={() => setSelectedProof(proof)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border
                             hover:border-brand-300 transition-all cursor-pointer bg-gray-50"
                >
                  {isImage ? (
                    <img
                      src={`${IPFS_GATEWAY}${proof.ipfsHash}`}
                      alt={proof.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                        const fallback = document.createElement('span');
                        fallback.textContent = proof.fileName;
                        fallback.className = 'text-xs text-text-muted text-center p-2';
                        (e.target as HTMLImageElement).parentElement!.appendChild(fallback);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                      <FileText size={24} className="text-orange-400" />
                      <span className="text-xs text-text-muted truncate w-full text-center">{proof.fileName}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">{formatDate(proof.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Lightbox proof={selectedProof} onClose={() => setSelectedProof(null)} />
    </>
  );
}
