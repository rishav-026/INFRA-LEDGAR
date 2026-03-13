import { useCallback, useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, FileText, ImageIcon } from 'lucide-react';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES, ALLOWED_FILE_EXTENSIONS } from '../../constants';
import { formatFileSize } from '../../utils/format';

interface DropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

interface FileError {
  name: string;
  error: string;
}

export function DropZone({ files, onFilesChange, maxFiles = 10 }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<FileError[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: File[] = [];
      const newErrors: FileError[] = [];

      Array.from(incoming).forEach((file) => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          newErrors.push({ name: file.name, error: 'Unsupported format. Only JPG, PNG, PDF, DOCX allowed.' });
        } else if (file.size > MAX_FILE_SIZE_BYTES) {
          newErrors.push({ name: file.name, error: `Exceeds 10MB limit (${formatFileSize(file.size)})` });
        } else if (files.length + newFiles.length >= maxFiles) {
          newErrors.push({ name: file.name, error: `Max ${maxFiles} files allowed` });
        } else {
          newFiles.push(file);
        }
      });

      setErrors(newErrors);
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    },
    [files, onFilesChange, maxFiles]
  );

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) validateAndAdd(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) validateAndAdd(e.target.files);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const getIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-blue-500" />;
    return <FileText size={20} className="text-orange-500" />;
  };

  return (
    <div className="space-y-3">
      {/* Drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-2 py-10 px-4
          border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${dragOver ? 'border-brand-500 bg-brand-50' : 'border-border hover:border-brand-300 hover:bg-surface-secondary'}
        `}
      >
        <Upload size={32} className={dragOver ? 'text-brand-500' : 'text-text-muted'} />
        <p className="text-sm text-text-secondary">
          Drag & drop files here or <span className="text-brand-600 font-medium">Browse Files</span>
        </p>
        <p className="text-xs text-text-muted">JPG, PNG, PDF, DOCX · Max 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_FILE_EXTENSIONS}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Error list */}
      {errors.map((err, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200">
          <span className="font-medium">{err.name}:</span> {err.error}
        </div>
      ))}

      {/* Selected files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-surface rounded-lg border border-border">
              {getIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
              </div>
              <button onClick={() => removeFile(i)} className="p-1 text-text-muted hover:text-red-500 cursor-pointer">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
