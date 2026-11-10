import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, X, HardDrive } from 'lucide-react';

export const FileUploadInput = ({
  label = 'Select File from Computer',
  selectedFile,
  onFileSelect,
  accept = '.pdf,.ppt,.pptx,.doc,.docx,.zip,.txt,.c,.cpp,.java,.py',
  helperText,
  required = false,
  showDriveNotice = true,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-[#4D4D4D]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#6C35F5] bg-[#F4F0FF]/50 scale-[1.01]'
            : selectedFile
            ? 'border-[#6C35F5]/40 bg-[#FBFBFF]'
            : 'border-[#E3E3E3] bg-[#FAFAFC] hover:border-[#6C35F5]/60 hover:bg-[#F9F7FF]'
        }`}
      >
        {selectedFile ? (
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-[#F4F0FF] text-[#6C35F5] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0D0D0D] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-[#888888] font-mono">
                  {formatSize(selectedFile.size)} · Click to change file
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-[#EFEFEF] rounded text-[#888888] hover:text-[#0D0D0D] transition-colors"
              title="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5 py-2">
            <div className="w-9 h-9 rounded-full bg-[#F4F0FF] text-[#6C35F5] mx-auto flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0D0D0D]">
                Choose file from computer or drag and drop
              </p>
              <p className="text-[11px] text-[#888888] mt-0.5">
                PDF, PPT, PPTX, Word DOC, ZIP, or Code files (up to 25 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {showDriveNotice && (
        <div className="flex items-start gap-1.5 pt-0.5 text-[11px] text-[#6C35F5]">
          <HardDrive className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Saved directly into your linked Google Drive folder (<code className="font-mono text-[10px] bg-purple-50 px-1 py-0.5 rounded">Class Connect - CSE 21</code>) and permanently available to all section members to view and download.
          </span>
        </div>
      )}

      {helperText && !showDriveNotice && (
        <p className="text-[11px] text-[#888888]">{helperText}</p>
      )}
    </div>
  );
};

