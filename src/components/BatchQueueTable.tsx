import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Archive,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Loader2,
  Play,
  Search,
  Trash2,
  FileText,
  Image as ImageIcon,
  FileType,
  Layers,
  ArrowRightCircle,
} from 'lucide-react';
import type { BatchItem, BatchSummary, FileKind, ToolId } from '../types/pdf';
import { calculateSavings, formatBytes } from '../utils/pdfUtils';
import type { TranslationDict } from '../i18n/translations';
import { ALL_TOOL_ORDER } from './ToolSidebar';

interface BatchQueueTableProps {
  items: BatchItem[];
  summary: BatchSummary;
  activeTool: ToolId;
  isProcessing: boolean;
  actionLabel: string;
  onRunBatch: () => void;
  onDownloadItem: (item: BatchItem) => void;
  onDownloadAllZip: () => void;
  onChainToTool: (nextTool: ToolId, singleItem?: BatchItem) => void;
  onPreviewItem: (item: BatchItem) => void;
  onMoveItem: (id: string, direction: -1 | 1) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  mergedArtifact: { filename: string; blob: Blob; size: number } | null;
  onDownloadMerged: () => void;
  t: TranslationDict;
}

type StatusFilter = 'all' | 'queued' | 'done' | 'error';

function FileKindIcon({ kind }: { kind: FileKind }) {
  if (kind === 'image') {
    return (
      <div className="w-8 h-8 rounded-md bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
        <ImageIcon className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (kind === 'word') {
    return (
      <div className="w-8 h-8 rounded-md bg-blue-100/80 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  if (kind === 'text') {
    return (
      <div className="w-8 h-8 rounded-md bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
        <FileType className="w-4 h-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-md bg-sky-100/80 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
      <FileText className="w-4 h-4" aria-hidden="true" />
    </div>
  );
}

export const BatchQueueTable: React.FC<BatchQueueTableProps> = ({
  items,
  summary,
  activeTool,
  isProcessing,
  actionLabel,
  onRunBatch,
  onDownloadItem,
  onDownloadAllZip,
  onChainToTool,
  onPreviewItem,
  onMoveItem,
  onRemoveItem,
  onClearCompleted,
  onClearAll,
  mergedArtifact,
  onDownloadMerged,
  t,
}) => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [chainTarget, setChainTarget] = useState<ToolId>(() =>
    activeTool === 'compress' ? 'protect' : 'compress'
  );

  const chainOptions = useMemo(
    () => ALL_TOOL_ORDER.filter((id) => id !== activeTool),
    [activeTool]
  );

  const effectiveChainTarget = chainOptions.includes(chainTarget)
    ? chainTarget
    : chainOptions[0] ?? 'compress';

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, search]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t.colFileName}
      className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg overflow-hidden"
    >
      {/* Queue Toolbar */}
      <div className="px-3.5 sm:px-4 py-3 border-b border-[#dce3e1] dark:border-[#2c3740] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
          <div className="max-w-full overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg min-w-max">
              {(
                [
                  { id: 'all', label: t.filterAll(items.length), icon: Layers },
                  { id: 'queued', label: t.filterReady(summary.queuedCount), icon: Clock },
                  { id: 'done', label: t.filterDone(summary.doneCount), icon: CheckCircle2 },
                  ...(summary.errorCount > 0
                    ? [
                        {
                          id: 'error' as const,
                          label: t.filterSkipped(summary.errorCount),
                          icon: AlertCircle,
                        },
                      ]
                    : []),
                ] as {
                  id: StatusFilter;
                  label: string;
                  icon: React.ComponentType<{ className?: string }>;
                }[]
              ).map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      filter === tab.id
                        ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                        : 'text-zinc-600 dark:text-[#a7b5be] hover:text-zinc-950 dark:hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {items.length > 4 && (
            <div className="relative w-full sm:w-auto">
              <Search
                className="w-4 h-4 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label={t.findFilePlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.findFilePlaceholder}
                className="h-10 sm:h-9 ps-9 pe-3 text-sm bg-[#f8faf9] dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-44"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {summary.doneCount > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-[#d6e0e5] hover:text-zinc-950 dark:hover:text-white hover:bg-[#eef2f1] dark:hover:bg-[#222b31] rounded-md transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{t.removeDone}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{t.clearList}</span>
          </button>
        </div>
      </div>

      {/* Mobile compact queue list */}
      <div className="sm:hidden divide-y divide-[#eef2f1] dark:divide-[#263038]">
        {filteredItems.map((item) => {
          const idx = items.findIndex((x) => x.id === item.id);
          const savings =
            item.outputSize !== undefined
              ? calculateSavings(item.originalSize, item.outputSize)
              : null;

          return (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileKindIcon kind={item.kind} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-[#f2f6f7] truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-[#a7b5be] font-mono tabular-nums mt-1">
                      {formatBytes(item.originalSize)}
                      {item.outputSize !== undefined
                        ? ` → ${formatBytes(item.outputSize)}`
                        : ''}
                      {activeTool === 'compress' && savings && savings.isSmaller
                        ? ` · ${t.statusSmaller(savings.percent)}`
                        : item.status === 'done'
                          ? ` · ${t.statusDone}`
                          : item.status === 'error'
                            ? ` · ${item.error || t.statusReady}`
                            : ` · ${t.statusReady}`}
                    </p>
                  </div>
                </div>
                {activeTool === 'merge' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMoveItem(item.id, -1)}
                      disabled={idx === 0 || isProcessing}
                      aria-label={`Move ${item.name} up`}
                      className="p-2 text-zinc-600 dark:text-[#d6e0e5] bg-[#eef2f1] dark:bg-[#222b31] rounded disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveItem(item.id, 1)}
                      disabled={idx === items.length - 1 || isProcessing}
                      aria-label={`Move ${item.name} down`}
                      className="p-2 text-zinc-600 dark:text-[#d6e0e5] bg-[#eef2f1] dark:bg-[#222b31] rounded disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewItem(item)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[40px] text-xs font-semibold text-zinc-800 dark:text-[#e6edf0] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] rounded-lg"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.btnView}</span>
                </button>
                {item.status === 'done' && item.outputs.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => onDownloadItem(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[40px] text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.btnSaveFile}</span>
                    </button>
                    {activeTool !== 'merge' &&
                      item.outputs.some(
                        (o) =>
                          o.mimeType === 'application/pdf' ||
                          o.mimeType.startsWith('image/')
                      ) && (
                        <button
                          type="button"
                          onClick={() => onChainToTool(effectiveChainTarget, item)}
                          aria-label={`${t.sendToNextTool}: ${t.tools[effectiveChainTarget].label} (${item.name})`}
                          className="inline-flex items-center justify-center gap-1 px-3 min-h-[40px] text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-lg"
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.sendToNextTool}</span>
                        </button>
                      )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isProcessing}
                  aria-label={`Remove ${item.name}`}
                  className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Data Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-[#dce3e1] dark:border-[#2c3740] bg-[#f8faf9] dark:bg-[#1e262c] text-xs font-semibold text-zinc-600 dark:text-[#a7b5be]">
              <th className="py-3 px-4 text-start">{t.colFileName}</th>
              <th className="py-3 px-3 text-end">{t.colBefore}</th>
              <th className="py-3 px-3 text-end">{t.colAfter}</th>
              <th className="py-3 px-3 text-start">{t.colStatus}</th>
              <th className="py-3 px-4 text-end">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f1] dark:divide-[#263038] text-sm">
            {filteredItems.map((item) => {
              const idx = items.findIndex((x) => x.id === item.id);
              const savings =
                item.outputSize !== undefined
                  ? calculateSavings(item.originalSize, item.outputSize)
                  : null;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[#f8faf9] dark:hover:bg-[#1d252b] transition-colors"
                >
                  <td className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center gap-2.5">
                      {activeTool === 'merge' && (
                        <div className="flex flex-col shrink-0">
                          <button
                            type="button"
                            onClick={() => onMoveItem(item.id, -1)}
                            disabled={idx === 0 || isProcessing}
                            aria-label={`Move ${item.name} up`}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveItem(item.id, 1)}
                            disabled={idx === items.length - 1 || isProcessing}
                            aria-label={`Move ${item.name} down`}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      <FileKindIcon kind={item.kind} />
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-[#f2f6f7] truncate max-w-[320px]">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-[#96a7b1] mt-0.5">
                          <span className="uppercase">{item.kind}</span>
                          {item.pageCount ? (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="tabular-nums">
                                {item.pageCount}
                              </span>
                            </>
                          ) : null}
                          {item.outputs.length > 1 ? (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="tabular-nums">
                                {t.totalFilesLabel(item.outputs.length)}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-end font-mono text-xs sm:text-sm tabular-nums text-zinc-600 dark:text-[#a7b5be] whitespace-nowrap">
                    {formatBytes(item.originalSize)}
                  </td>

                  <td className="py-3 px-3 text-end font-mono text-xs sm:text-sm tabular-nums text-zinc-900 dark:text-[#f2f6f7] whitespace-nowrap">
                    {item.outputSize !== undefined ? formatBytes(item.outputSize) : '—'}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.status === 'queued' && (
                      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 dark:text-[#96a7b1]">
                        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{t.statusReady}</span>
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <Loader2
                          className="w-4 h-4 text-amber-500 animate-spin shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-xs sm:text-sm font-medium font-mono tabular-nums text-amber-600 dark:text-amber-400">
                          {t.statusWorking(item.progress)}
                        </span>
                      </div>
                    )}
                    {item.status === 'done' && (
                      <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
                          {activeTool === 'compress' && savings && savings.isSmaller
                            ? t.statusSmaller(savings.percent)
                            : t.statusDone}
                        </span>
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 max-w-[220px]"
                        title={item.error}
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.error || t.statusReady}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-end whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onPreviewItem(item)}
                        aria-label={`${t.btnView} ${item.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-[#e6edf0] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.btnView}</span>
                      </button>

                      {item.status === 'done' && item.outputs.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => onDownloadItem(item)}
                            aria-label={`${t.btnSave} ${item.name}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t.btnSave}</span>
                          </button>

                          {activeTool !== 'merge' &&
                            item.outputs.some(
                              (o) =>
                                o.mimeType === 'application/pdf' ||
                                o.mimeType.startsWith('image/')
                            ) && (
                              <button
                                type="button"
                                onClick={() => onChainToTool(effectiveChainTarget, item)}
                                title={`${t.sendToNextTool}: ${t.tools[effectiveChainTarget].label}`}
                                aria-label={`${t.sendToNextTool} ${item.name}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-lg transition-colors whitespace-nowrap"
                              >
                                <ArrowRightCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{t.sendToNextTool}</span>
                              </button>
                            )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={isProcessing}
                        aria-label={`Remove ${item.name}`}
                        className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Workflow Chaining Bar (after at least 1 finished PDF/image output exists) */}
      {(summary.doneCount > 0 || mergedArtifact !== null) && (
        <div className="px-3.5 sm:px-4 py-3 bg-[#edf7f5]/70 dark:bg-[#162328] border-t border-[#dce3e1] dark:border-[#2c3740] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-200">
            <ArrowRightCircle className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
            <span>{t.sendResultsToNext}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              aria-label={t.sendResultsToNext}
              value={effectiveChainTarget}
              onChange={(e) => setChainTarget(e.target.value as ToolId)}
              className="flex-1 sm:flex-initial min-w-0 h-10 sm:h-9 px-3 text-xs sm:text-sm font-medium bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {chainOptions.map((toolId) => (
                <option key={toolId} value={toolId}>
                  {t.tools[toolId].label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onChainToTool(effectiveChainTarget)}
              className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-9 px-4 sm:px-3.5 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <span>{t.chainGo}</span>
            </button>
          </div>
        </div>
      )}

      {/* Batch Summary & Primary Action Footer */}
      <div className="px-3.5 sm:px-4 py-4 bg-[#f8faf9] dark:bg-[#151b20] border-t border-[#dce3e1] dark:border-[#2c3740] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="text-xs sm:text-sm text-zinc-600 dark:text-[#a7b5be] flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-white">
            {t.totalFilesLabel(summary.totalFiles)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {t.totalBefore} {formatBytes(summary.totalOriginalBytes)}
          </span>
          {summary.doneCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-zinc-900 dark:text-white">
                {t.totalNow} {formatBytes(summary.totalOutputBytes)}
              </span>
              {activeTool === 'compress' && summary.savedBytes > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    {t.totalSaved(formatBytes(summary.savedBytes), summary.savedPercent)}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {mergedArtifact && activeTool === 'merge' && (
            <button
              type="button"
              onClick={onDownloadMerged}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] w-full sm:w-auto text-sm font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {t.btnSave} {mergedArtifact.filename} ({formatBytes(mergedArtifact.size)})
              </span>
            </button>
          )}

          {summary.doneCount > 0 && activeTool !== 'merge' && (
            <button
              type="button"
              onClick={onDownloadAllZip}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] w-full sm:w-auto text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] hover:bg-[#eef2f1] dark:hover:bg-[#2a353d] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span>{t.downloadAllZip}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRunBatch}
            disabled={isProcessing || items.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] w-full sm:w-auto text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#151b20]"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{isProcessing ? t.workingOnFiles : actionLabel}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
