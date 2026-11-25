import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Download,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import type { BatchItem, PageEditState } from '../types/pdf';
import { renderPdfSinglePage, renderPdfThumbnails } from '../services/pdfEngine';
import { calculateSavings, formatBytes, reorderArray } from '../utils/pdfUtils';
import type { TranslationDict } from '../i18n/translations';

interface InspectorPanelProps {
  item: BatchItem | null;
  onClose: () => void;
  onUpdatePageEdits: (itemId: string, edits: PageEditState[]) => void;
  onApplyOrganizeExport: (item: BatchItem, edits: PageEditState[]) => void;
  onDownloadItem: (item: BatchItem) => void;
  t: TranslationDict;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  item,
  onClose,
  onUpdatePageEdits,
  onApplyOrganizeExport,
  onDownloadItem,
  t,
}) => {
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const primaryVisualOutput = item?.outputs.find(
    (o) => o.mimeType === 'application/pdf' || o.mimeType.startsWith('image/')
  );
  const canCompare = Boolean(
    item &&
      item.status === 'done' &&
      primaryVisualOutput &&
      ((item.kind === 'pdf' && primaryVisualOutput.mimeType === 'application/pdf') ||
        (item.kind === 'image' && primaryVisualOutput.mimeType.startsWith('image/')))
  );

  const [viewMode, setViewMode] = useState<'compare' | 'pages'>('pages');
  const [comparePage, setComparePage] = useState(1);
  const [compareTotalPages, setCompareTotalPages] = useState(1);
  const [beforeCompareUrl, setBeforeCompareUrl] = useState<string | null>(null);
  const [afterCompareUrl, setAfterCompareUrl] = useState<string | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareUnavailable, setCompareUnavailable] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const compareBoxRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!item) return;
    setCopied(false);
    setComparePage(1);
    setSplitPct(50);
    setCompareUnavailable(false);
    setViewMode(canCompare ? 'compare' : 'pages');
  }, [item?.id, item?.status, item?.outputSize, canCompare]);

  useEffect(() => {
    if (!item) return;

    let cancelled = false;

    if (item.kind === 'image') {
      const copy = new Uint8Array(item.bytes.byteLength);
      copy.set(item.bytes);
      const url = URL.createObjectURL(new Blob([copy.buffer], { type: item.mimeType }));
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setImagePreviewUrl(null);

    if (item.kind === 'pdf' && (!item.pageEdits || item.pageEdits.length === 0)) {
      setLoadingThumbs(true);
      renderPdfThumbnails(item.bytes, 24, 0.45)
        .then((thumbs) => {
          if (cancelled) return;
          const edits: PageEditState[] = thumbs.map((thumb) => ({
            pageNumber: thumb.pageNumber,
            rotation: 0,
            deleted: false,
            thumbnailUrl: thumb.dataUrl,
          }));
          onUpdatePageEdits(item.id, edits);
        })
        .catch(() => {
          // Handled gracefully with empty thumbnail list
        })
        .finally(() => {
          if (!cancelled) setLoadingThumbs(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [item?.id]);

  useEffect(() => {
    if (!item || !canCompare || !primaryVisualOutput || viewMode !== 'compare') {
      return;
    }

    let cancelled = false;
    let tempBeforeUrl: string | null = null;
    let tempAfterUrl: string | null = null;

    setLoadingCompare(true);
    setCompareUnavailable(false);

    (async () => {
      try {
        if (item.kind === 'image') {
          const origCopy = new Uint8Array(item.bytes.byteLength);
          origCopy.set(item.bytes);
          tempBeforeUrl = URL.createObjectURL(
            new Blob([origCopy.buffer], { type: item.mimeType || 'image/png' })
          );
          tempAfterUrl = URL.createObjectURL(primaryVisualOutput.blob);
          if (!cancelled) {
            setBeforeCompareUrl(tempBeforeUrl);
            setAfterCompareUrl(tempAfterUrl);
            setCompareTotalPages(1);
          }
          return;
        }

        const outBuf = await primaryVisualOutput.blob.arrayBuffer();
        const outBytes = new Uint8Array(outBuf);
        const [origRender, outRender] = await Promise.all([
          renderPdfSinglePage(item.bytes, comparePage, 1.55),
          renderPdfSinglePage(outBytes, comparePage, 1.55),
        ]);
        if (!cancelled) {
          setBeforeCompareUrl(origRender.dataUrl);
          setAfterCompareUrl(outRender.dataUrl);
          setCompareTotalPages(Math.min(origRender.totalPages, outRender.totalPages));
        }
      } catch {
        if (!cancelled) {
          setCompareUnavailable(true);
          setViewMode('pages');
        }
      } finally {
        if (!cancelled) setLoadingCompare(false);
      }
    })();

    return () => {
      cancelled = true;
      if (tempBeforeUrl) URL.revokeObjectURL(tempBeforeUrl);
      if (tempAfterUrl) URL.revokeObjectURL(tempAfterUrl);
    };
  }, [item?.id, item?.outputSize, primaryVisualOutput, canCompare, viewMode, comparePage]);

  if (!item) return null;

  const extractedPreview = item.outputs.find((o) => o.previewText)?.previewText;
  const savings =
    item.outputSize !== undefined
      ? calculateSavings(item.originalSize, item.outputSize)
      : null;

  const edits = item.pageEdits ?? [];

  const handleRotatePage = (pageIndex: number, delta: number) => {
    const next = edits.map((p, i) =>
      i === pageIndex ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p
    );
    onUpdatePageEdits(item.id, next);
  };

  const handleMovePage = (pageIndex: number, delta: -1 | 1) => {
    const next = reorderArray(edits, pageIndex, pageIndex + delta);
    onUpdatePageEdits(item.id, next);
  };

  const handleToggleDelete = (pageIndex: number) => {
    const next = edits.map((p, i) =>
      i === pageIndex ? { ...p, deleted: !p.deleted } : p
    );
    onUpdatePageEdits(item.id, next);
  };

  const handleCopyText = async () => {
    if (!extractedPreview) return;
    await navigator.clipboard.writeText(extractedPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const updateSplitFromClientX = (clientX: number) => {
    const box = compareBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const pct = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
    setSplitPct(Math.round(Math.min(100, Math.max(0, pct))));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-title"
    >
      <div className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg w-full max-w-4xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-[#dce3e1] dark:border-[#2c3740] flex items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <h2
              id="inspector-title"
              className="text-base font-semibold text-zinc-900 dark:text-[#f2f6f7] truncate"
            >
              {item.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-[#96a7b1] font-mono tabular-nums mt-0.5">
              {t.inspectorBefore} {formatBytes(item.originalSize)}
              {item.outputSize !== undefined
                ? ` · ${t.inspectorAfter} ${formatBytes(item.outputSize)}`
                : ''}
              {savings && savings.isSmaller ? ` · ${t.statusSmaller(savings.percent)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {item.status === 'done' && item.outputs.length > 0 && (
              <button
                type="button"
                onClick={() => onDownloadItem(item)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{t.btnSaveFile}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.inspectorClose}
              className="p-2 text-zinc-500 dark:text-[#96a7b1] hover:text-zinc-900 dark:hover:text-white hover:bg-[#eef2f1] dark:hover:bg-[#222b31] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mode Switcher when Before/After comparison is available */}
        {canCompare && !compareUnavailable && (
          <div className="px-5 py-2.5 border-b border-[#dce3e1] dark:border-[#2c3740] bg-[#f8faf9] dark:bg-[#151b20] flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-[#e5ecea] dark:bg-[#222b31] rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('compare')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'compare'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>{t.compareTabCompare}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pages')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'pages'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be]'
                }`}
              >
                <span>{t.compareTabPages}</span>
              </button>
            </div>

            {viewMode === 'compare' && compareTotalPages > 1 && (
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-700 dark:text-[#d6e0e5]">
                <button
                  type="button"
                  disabled={comparePage <= 1 || loadingCompare}
                  onClick={() => setComparePage((p) => Math.max(1, p - 1))}
                  aria-label={t.inspectorMoveUp}
                  className="p-1.5 rounded bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <span>
                  {t.inspectorPageNum(comparePage)} / {compareTotalPages}
                </span>
                <button
                  type="button"
                  disabled={comparePage >= compareTotalPages || loadingCompare}
                  onClick={() => setComparePage((p) => Math.min(compareTotalPages, p + 1))}
                  aria-label={t.inspectorMoveDown}
                  className="p-1.5 rounded bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 bg-[#f4f7f6] dark:bg-[#111619] space-y-4 sm:space-y-5">
          {extractedPreview && (
            <div className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-[#e6edf0]">
                  {t.inspectorWordsFound}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-[#e6edf0] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                      <span>{t.inspectorCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t.inspectorCopyAll}</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-zinc-800 dark:text-[#e6edf0] whitespace-pre-wrap max-h-72 overflow-y-auto bg-[#f8faf9] dark:bg-[#111619] p-3.5 rounded border border-[#dce3e1] dark:border-[#2c3740] leading-relaxed">
                {extractedPreview}
              </pre>
            </div>
          )}

          {/* Before / After Interactive Comparison Slider */}
          {canCompare && !compareUnavailable && viewMode === 'compare' && (
            <div className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#eef2f1] dark:bg-[#222b31] text-zinc-800 dark:text-[#e6edf0]">
                  <span>{t.compareOriginal}</span>
                  <span className="font-mono text-zinc-500 dark:text-[#96a7b1]">
                    {formatBytes(item.originalSize)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
                  <span>{t.compareProcessed}</span>
                  <span className="font-mono">
                    {formatBytes(item.outputSize ?? primaryVisualOutput?.size ?? 0)}
                  </span>
                </span>
              </div>

              {loadingCompare || !beforeCompareUrl || !afterCompareUrl ? (
                <div className="h-80 rounded-lg bg-[#eef2f1] dark:bg-[#222b31] flex items-center justify-center text-sm text-zinc-600 dark:text-[#a7b5be]">
                  {t.compareLoading}
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    ref={compareBoxRef}
                    dir="ltr"
                    onPointerDown={(e) => {
                      draggingRef.current = true;
                      if (typeof e.currentTarget.setPointerCapture === 'function') {
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId);
                        } catch {
                          // Ignore unsupported pointer capture
                        }
                      }
                      updateSplitFromClientX(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (draggingRef.current) {
                        updateSplitFromClientX(e.clientX);
                      }
                    }}
                    onPointerUp={() => {
                      draggingRef.current = false;
                    }}
                    onPointerCancel={() => {
                      draggingRef.current = false;
                    }}
                    onPointerLeave={() => {
                      draggingRef.current = false;
                    }}
                    className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg border border-[#dce3e1] dark:border-[#2c3740] bg-white select-none cursor-ew-resize touch-none"
                  >
                    <img
                      src={afterCompareUrl}
                      alt={t.compareProcessed}
                      draggable={false}
                      className="block max-h-[44dvh] sm:max-h-[52vh] w-auto object-contain"
                    />
                    <img
                      src={beforeCompareUrl}
                      alt={t.compareOriginal}
                      draggable={false}
                      style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                    <div
                      aria-hidden="true"
                      style={{ left: `${splitPct}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-teal-600 dark:bg-teal-400 shadow-sm pointer-events-none"
                    >
                      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950 flex items-center justify-center shadow">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-zinc-600 dark:text-[#a7b5be] shrink-0">
                      {t.inspectorBefore}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={splitPct}
                      aria-label={t.compareSliderLabel}
                      onChange={(e) => setSplitPct(Number(e.target.value))}
                      className="w-full accent-teal-700 dark:accent-teal-400"
                    />
                    <span className="text-xs font-medium text-teal-700 dark:text-teal-400 shrink-0">
                      {t.inspectorAfter}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {imagePreviewUrl && (!canCompare || viewMode === 'pages') && (
            <div className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg p-4 flex justify-center">
              <img
                src={imagePreviewUrl}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="max-h-[55vh] object-contain rounded border border-[#dce3e1] dark:border-[#2c3740]"
              />
            </div>
          )}

          {item.kind === 'pdf' && (!canCompare || viewMode === 'pages') && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-zinc-800 dark:text-[#e6edf0]">
                  {t.inspectorPagesTitle}
                </p>
                {edits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onApplyOrganizeExport(item, edits)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-[#e6edf0] bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] hover:bg-[#eef2f1] dark:hover:bg-[#2a353d] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    <span>{t.inspectorSavePages}</span>
                  </button>
                )}
              </div>

              {loadingThumbs ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-44 rounded-lg bg-[#e2e9e7] dark:bg-[#222b31] animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {edits.map((page, index) => (
                    <div
                      key={`${page.pageNumber}-${index}`}
                      className={`bg-white dark:bg-[#181f24] border rounded-lg p-2.5 flex flex-col gap-2 transition-opacity ${
                        page.deleted
                          ? 'border-rose-400 dark:border-rose-700 opacity-55'
                          : 'border-[#dce3e1] dark:border-[#2c3740]'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-[#f4f7f6] dark:bg-[#111619] rounded overflow-hidden flex items-center justify-center">
                        {page.thumbnailUrl ? (
                          <img
                            src={page.thumbnailUrl}
                            alt={t.inspectorPageNum(page.pageNumber)}
                            referrerPolicy="no-referrer"
                            style={{ transform: `rotate(${page.rotation}deg)` }}
                            className="max-w-full max-h-full object-contain transition-transform duration-150"
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">
                            {t.inspectorPageNum(page.pageNumber)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 sm:gap-1">
                        <span className="font-mono tabular-nums text-zinc-700 dark:text-[#d6e0e5] truncate">
                          {t.inspectorPageNum(page.pageNumber)}
                          {page.rotation > 0 ? ` · ${page.rotation}°` : ''}
                        </span>
                        <div className="flex items-center justify-between sm:justify-end gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMovePage(index, -1)}
                            disabled={index === 0}
                            aria-label={`${t.inspectorMoveUp} - ${t.inspectorPageNum(page.pageNumber)}`}
                            className="p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-zinc-600 dark:text-[#d6e0e5] hover:text-zinc-900 dark:hover:text-white hover:bg-[#eef2f1] dark:hover:bg-[#222b31] rounded disabled:opacity-30"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePage(index, 1)}
                            disabled={index === edits.length - 1}
                            aria-label={`${t.inspectorMoveDown} - ${t.inspectorPageNum(page.pageNumber)}`}
                            className="p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-zinc-600 dark:text-[#d6e0e5] hover:text-zinc-900 dark:hover:text-white hover:bg-[#eef2f1] dark:hover:bg-[#222b31] rounded disabled:opacity-30"
                          >
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRotatePage(index, -90)}
                            aria-label={`${t.turnLeft} - ${t.inspectorPageNum(page.pageNumber)}`}
                            className="p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-zinc-600 dark:text-[#d6e0e5] hover:text-zinc-900 dark:hover:text-white hover:bg-[#eef2f1] dark:hover:bg-[#222b31] rounded"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRotatePage(index, 90)}
                            aria-label={`${t.turnRight} - ${t.inspectorPageNum(page.pageNumber)}`}
                            className="p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-zinc-600 dark:text-[#d6e0e5] hover:text-zinc-900 dark:hover:text-white hover:bg-[#eef2f1] dark:hover:bg-[#222b31] rounded"
                          >
                            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleDelete(index)}
                            aria-label={t.inspectorPageNum(page.pageNumber)}
                            className={`p-1.5 sm:p-1 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded ${
                              page.deleted
                                ? 'text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50'
                                : 'text-zinc-500 dark:text-[#96a7b1] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                            }`}
                          >
                            {page.deleted ? (
                              <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
