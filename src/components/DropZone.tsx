import React, { useRef, useState } from 'react';
import { FolderUp, FolderOpen, Plus, PenLine } from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';

interface DropZoneProps {
  onFilesAdded: (files: FileList | File[]) => void;
  onLoadSampleBatch?: () => void;
  isLoadingSamples?: boolean;
  showTextComposer: boolean;
  onAddTextDocument: (title: string, body: string) => void;
  compact?: boolean;
  t: TranslationDict;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesAdded,
  showTextComposer,
  onAddTextDocument,
  compact = false,
  t,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textBody, setTextBody] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesAdded(e.target.files);
            e.target.value = '';
          }
        }}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-teal-600 bg-teal-50/60 dark:border-teal-400 dark:bg-teal-950/30'
            : 'border-[#c6d2cf] dark:border-[#32404a] bg-white dark:bg-[#181f24] hover:border-teal-600/60 dark:hover:border-teal-400/50'
        } ${compact ? 'px-5 py-4' : 'px-6 py-8'}`}
      >
        <div
          className={`flex ${
            compact
              ? 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'
              : 'flex-col items-center text-center max-w-xl mx-auto gap-3.5'
          }`}
        >
          <div className={`flex items-center gap-3.5 ${compact ? '' : 'flex-col'}`}>
            <div className="w-11 h-11 rounded-lg bg-teal-100/80 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/25 flex items-center justify-center shrink-0">
              <FolderUp className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900 dark:text-[#f2f6f7] text-balance">
                {compact ? t.addMoreFiles : t.step2PickFiles}
              </p>
              <p className="text-sm text-zinc-600 dark:text-[#a7b5be] mt-0.5 text-balance">
                {t.dropHelper}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <FolderOpen className="w-4 h-4" aria-hidden="true" />
              <span>{t.chooseFiles}</span>
            </button>
          </div>
        </div>
      </div>

      {showTextComposer && (
        <div className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-[#f2f6f7]">
              <PenLine className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
              <span>{t.notesHeader}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                const finalBody = textBody.trim() || t.noteBodyPlaceholder;
                const finalTitle = textTitle.trim() || t.noteTitlePlaceholder;
                onAddTextDocument(finalTitle, finalBody);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t.addNotesBtn}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <input
              type="text"
              aria-label={t.noteTitlePlaceholder}
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder={t.noteTitlePlaceholder}
              className="h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <textarea
              aria-label={t.noteBodyPlaceholder}
              rows={4}
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              placeholder={t.noteBodyPlaceholder}
              className="w-full p-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
