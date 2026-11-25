import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  SlidersHorizontal,
  Feather,
  ThumbsUp,
  Mail,
  Layers,
  Scissors,
  Stamp,
  FileText,
  Monitor,
  Image as ImageIcon,
  Contrast,
  ShieldCheck,
  LayoutTemplate,
  ScanEye,
  ArrowUpDown,
  Files,
  Hash,
  AlignCenter,
  Palette,
  FileCode,
  Braces,
  Trash2,
  Type,
  PenTool,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Eraser,
  FileType2,
  FileOutput,
  Target,
  Crop,
  Tags,
  FileCheck2,
  ImagePlus,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import type {
  AddTextFont,
  AddTextOptions,
  AddTextPlacement,
  CompressionOptions,
  CompressionPreset,
  CropOptions,
  DeletePagesOptions,
  ExtractFormat,
  FlattenOptions,
  ImageOutputFormat,
  ImagesToPdfOptions,
  MetadataOptions,
  PageNumberFormat,
  PageNumberOptions,
  PageNumberPosition,
  PdfToImagesOptions,
  ProtectOptions,
  SignOptions,
  SignPlacement,
  SplitOptions,
  StampImageOptions,
  StampImagePlacement,
  ToolId,
  UnlockOptions,
  WatermarkOptions,
} from '../types/pdf';
import { createSampleStampPngBytes } from '../services/pdfEngine';
import type { TranslationDict } from '../i18n/translations';

interface ToolOptionsBarProps {
  activeTool: ToolId;
  compression: CompressionOptions;
  onChangeCompression: (next: CompressionOptions) => void;
  onSelectCompressionPreset: (preset: CompressionPreset) => void;
  pdfToImages: PdfToImagesOptions;
  onChangePdfToImages: (next: PdfToImagesOptions) => void;
  imagesToPdf: ImagesToPdfOptions;
  onChangeImagesToPdf: (next: ImagesToPdfOptions) => void;
  mergeFilename: string;
  onChangeMergeFilename: (name: string) => void;
  split: SplitOptions;
  onChangeSplit: (next: SplitOptions) => void;
  deletePages: DeletePagesOptions;
  onChangeDeletePages: (next: DeletePagesOptions) => void;
  crop: CropOptions;
  onChangeCrop: (next: CropOptions) => void;
  metadata: MetadataOptions;
  onChangeMetadata: (next: MetadataOptions) => void;
  onLoadMetadataFromFirstPdf: () => void;
  flatten: FlattenOptions;
  onChangeFlatten: (next: FlattenOptions) => void;
  stampImage: StampImageOptions;
  onChangeStampImage: (next: StampImageOptions) => void;
  pageNumbers: PageNumberOptions;
  onChangePageNumbers: (next: PageNumberOptions) => void;
  watermark: WatermarkOptions;
  onChangeWatermark: (next: WatermarkOptions) => void;
  addText: AddTextOptions;
  onChangeAddText: (next: AddTextOptions) => void;
  sign: SignOptions;
  onChangeSign: (next: SignOptions) => void;
  protect: ProtectOptions;
  onChangeProtect: (next: ProtectOptions) => void;
  unlock: UnlockOptions;
  onChangeUnlock: (next: UnlockOptions) => void;
  extractFormat: ExtractFormat;
  onChangeExtractFormat: (fmt: ExtractFormat) => void;
  onBatchRotateAll: (delta: number) => void;
  canOpenFirstPdf: boolean;
  onOpenFirstPdf: () => void;
  t: TranslationDict;
}

export const ToolOptionsBar: React.FC<ToolOptionsBarProps> = ({
  activeTool,
  compression,
  onChangeCompression,
  onSelectCompressionPreset,
  pdfToImages,
  onChangePdfToImages,
  imagesToPdf,
  onChangeImagesToPdf,
  mergeFilename,
  onChangeMergeFilename,
  split,
  onChangeSplit,
  deletePages,
  onChangeDeletePages,
  crop,
  onChangeCrop,
  metadata,
  onChangeMetadata,
  onLoadMetadataFromFirstPdf,
  flatten,
  onChangeFlatten,
  stampImage,
  onChangeStampImage,
  pageNumbers,
  onChangePageNumbers,
  watermark,
  onChangeWatermark,
  addText,
  onChangeAddText,
  sign,
  onChangeSign,
  protect,
  onChangeProtect,
  unlock,
  onChangeUnlock,
  extractFormat,
  onChangeExtractFormat,
  onBatchRotateAll,
  canOpenFirstPdf,
  onOpenFirstPdf,
  t,
}) => {
  const [showAdvancedCompress, setShowAdvancedCompress] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stampPreviewUrl, setStampPreviewUrl] = useState<string | null>(null);
  const stampInputRef = useRef<HTMLInputElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    if (!stampImage.imageBytes) {
      setStampPreviewUrl(null);
      return;
    }
    const copy = new Uint8Array(stampImage.imageBytes.byteLength);
    copy.set(stampImage.imageBytes);
    const url = URL.createObjectURL(
      new Blob([copy.buffer], { type: stampImage.imageMimeType || 'image/png' })
    );
    setStampPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [stampImage.imageBytes, stampImage.imageMimeType]);

  useEffect(() => {
    if (activeTool !== 'sign' || sign.mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [activeTool, sign.mode]);

  const exportSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      blob.arrayBuffer().then((buf) => {
        onChangeSign({ ...sign, signaturePngBytes: new Uint8Array(buf) });
      });
    }, 'image/png');
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (typeof canvas.setPointerCapture === 'function') {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Ignore unsupported pointer capture
      }
    }
    isDrawingRef.current = true;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    exportSignatureCanvas();
  };

  const clearSignaturePad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChangeSign({ ...sign, signaturePngBytes: null });
  };

  const compressCards: {
    preset: CompressionPreset;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    idleTint: string;
  }[] = [
    {
      preset: 'lossless',
      title: t.presetGentleTitle,
      desc: t.presetGentleDesc,
      icon: Feather,
      idleTint: 'bg-sky-100/80 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300',
    },
    {
      preset: 'balanced',
      title: t.presetRecommendedTitle,
      desc: t.presetRecommendedDesc,
      icon: ThumbsUp,
      idleTint: 'bg-teal-100/80 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300',
    },
    {
      preset: 'maximum',
      title: t.presetSmallestTitle,
      desc: t.presetSmallestDesc,
      icon: Mail,
      idleTint: 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
    },
    {
      preset: 'target-size',
      title: t.presetTargetTitle,
      desc: t.presetTargetDesc,
      icon: Target,
      idleTint: 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    },
  ];

  const pageNumberPositions: { value: PageNumberPosition; label: string }[] = [
    { value: 'top-left', label: t.posTopLeft },
    { value: 'top-center', label: t.posTopCenter },
    { value: 'top-right', label: t.posTopRight },
    { value: 'bottom-left', label: t.posBottomLeft },
    { value: 'bottom-center', label: t.posBottomCenter },
    { value: 'bottom-right', label: t.posBottomRight },
  ];

  return (
    <section
      aria-label="Tool settings"
      className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg p-4 sm:p-5"
    >
      {activeTool === 'compress' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-[#f2f6f7]">
                {t.compressQuestion}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-[#a7b5be] mt-0.5">
                {t.compressSubtitle}
              </p>
            </div>
            <button
              type="button"
              aria-expanded={showAdvancedCompress}
              onClick={() => setShowAdvancedCompress((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-[#d6e0e5] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] border border-[#d3dedb] dark:border-[#32404a] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <span>{showAdvancedCompress ? t.hideAdvanced : t.advancedSettings}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {compressCards.map((card) => {
              const selected = compression.preset === card.preset;
              const CardIcon = card.icon;
              return (
                <button
                  key={card.preset}
                  type="button"
                  onClick={() => onSelectCompressionPreset(card.preset)}
                  className={`text-start p-3.5 rounded-lg border transition-colors flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    selected
                      ? 'bg-[#edf7f5] dark:bg-teal-950/35 border-teal-600 dark:border-teal-400 text-zinc-950 dark:text-white'
                      : 'bg-[#f8faf9] dark:bg-[#141a1e] border-[#dce3e1] dark:border-[#2c3740] text-zinc-700 dark:text-[#d6e0e5] hover:border-[#b9c7c3] dark:hover:border-[#3d4d59]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      selected
                        ? 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950'
                        : card.idleTint
                    }`}
                  >
                    <CardIcon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-semibold">{card.title}</span>
                    <span className="block text-xs mt-1 text-zinc-500 dark:text-[#96a7b1]">
                      {card.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {compression.preset === 'target-size' && (
            <div className="p-3.5 rounded-lg bg-[#f4f7f6] dark:bg-[#141a1e] border border-[#dce3e1] dark:border-[#2c3740] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0]">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{t.targetSizeLimitLabel}</span>
                </span>
                {[1, 2, 5, 10].map((mb) => (
                  <button
                    key={mb}
                    type="button"
                    onClick={() =>
                      onChangeCompression({
                        ...compression,
                        preset: 'target-size',
                        targetSizeMb: mb,
                      })
                    }
                    className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md border transition-colors ${
                      Math.abs(compression.targetSizeMb - mb) < 0.01
                        ? 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950 border-teal-700 dark:border-teal-400'
                        : 'bg-white dark:bg-[#222b31] text-zinc-700 dark:text-[#d6e0e5] border-[#cfd9d6] dark:border-[#32404a]'
                    }`}
                  >
                    {mb} MB
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-[#d6e0e5]">
                <span>{t.targetSizeCustomMb}</span>
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.5}
                  value={compression.targetSizeMb}
                  onChange={(e) =>
                    onChangeCompression({
                      ...compression,
                      preset: 'target-size',
                      targetSizeMb: Math.max(0.1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-20 h-9 px-2.5 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                />
              </label>
            </div>
          )}

          {showAdvancedCompress && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#dce3e1] dark:border-[#2c3740]">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label
                    htmlFor="compress-dpi"
                    className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-[#d6e0e5]"
                  >
                    <Monitor className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    <span>{t.targetResolution}</span>
                  </label>
                  <span className="font-mono tabular-nums text-zinc-600 dark:text-[#96a7b1]">
                    {compression.dpi} DPI
                  </span>
                </div>
                <input
                  id="compress-dpi"
                  type="range"
                  min={72}
                  max={240}
                  step={2}
                  disabled={compression.preset === 'lossless'}
                  value={compression.dpi}
                  onChange={(e) =>
                    onChangeCompression({
                      ...compression,
                      preset: 'custom',
                      dpi: Number(e.target.value),
                    })
                  }
                  className="w-full accent-teal-700 dark:accent-teal-400 disabled:opacity-40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label
                    htmlFor="compress-quality"
                    className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-[#d6e0e5]"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                    <span>{t.imageQuality}</span>
                  </label>
                  <span className="font-mono tabular-nums text-zinc-600 dark:text-[#96a7b1]">
                    {Math.round(compression.imageQuality * 100)}%
                  </span>
                </div>
                <input
                  id="compress-quality"
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  disabled={compression.preset === 'lossless'}
                  value={compression.imageQuality}
                  onChange={(e) =>
                    onChangeCompression({
                      ...compression,
                      preset: 'custom',
                      imageQuality: Number(e.target.value),
                    })
                  }
                  className="w-full accent-teal-700 dark:accent-teal-400 disabled:opacity-40"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-[#d6e0e5] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={compression.grayscale}
                  disabled={compression.preset === 'lossless'}
                  onChange={(e) =>
                    onChangeCompression({
                      ...compression,
                      preset: 'custom',
                      grayscale: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-zinc-300 dark:border-[#3b4954] text-teal-700 focus:ring-teal-500 disabled:opacity-40"
                />
                <Contrast className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                <span>{t.blackAndWhite}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-[#d6e0e5] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={compression.stripMetadata}
                  onChange={(e) =>
                    onChangeCompression({
                      ...compression,
                      stripMetadata: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-zinc-300 dark:border-[#3b4954] text-teal-700 focus:ring-teal-500"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{t.stripExtraInfo}</span>
              </label>
            </div>
          )}
        </div>
      )}

      {activeTool === 'merge' && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[240px] max-w-md">
            <label
              htmlFor="merge-filename"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span>{t.mergeFilenameLabel}</span>
            </label>
            <input
              id="merge-filename"
              type="text"
              value={mergeFilename}
              onChange={(e) => onChangeMergeFilename(e.target.value)}
              placeholder="combined_files.pdf"
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <p className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-[#a7b5be]">
            <ArrowUpDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>{t.mergeOrderHint}</span>
          </p>
        </div>
      )}

      {activeTool === 'split' && (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5">
              <Scissors className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
              <span>{t.splitQuestion}</span>
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg">
              <button
                type="button"
                onClick={() => onChangeSplit({ ...split, mode: 'all' })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  split.mode === 'all'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be] hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                <Files className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.splitAllPages}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeSplit({ ...split, mode: 'ranges' })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  split.mode === 'ranges'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be] hover:text-zinc-950 dark:hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.splitPickNumbers}</span>
              </button>
            </div>
          </div>

          {split.mode === 'ranges' && (
            <div className="flex-1 min-w-[220px] max-w-xs">
              <label
                htmlFor="split-ranges"
                className="block text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
              >
                {t.splitPagesLabel}
              </label>
              <input
                id="split-ranges"
                type="text"
                value={split.ranges}
                onChange={(e) => onChangeSplit({ ...split, ranges: e.target.value })}
                placeholder="1-2, 4"
                className="w-full h-11 px-3.5 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </div>
      )}

      {activeTool === 'pdf-to-images' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5">
              <ImageIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" aria-hidden="true" />
              <span>{t.pdfToImgFormatLabel}</span>
            </span>
            <div className="flex items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg">
              {(['png', 'jpeg', 'webp'] as ImageOutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onChangePdfToImages({ ...pdfToImages, format: fmt })}
                  className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md uppercase transition-colors ${
                    pdfToImages.format === fmt
                      ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-[#a7b5be] hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  {fmt === 'jpeg' ? 'JPG' : fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="pdf-to-img-clarity"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <ScanEye className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
              <span>{t.pdfToImgClarityLabel}</span>
            </label>
            <select
              id="pdf-to-img-clarity"
              value={pdfToImages.dpi}
              onChange={(e) =>
                onChangePdfToImages({ ...pdfToImages, dpi: Number(e.target.value) })
              }
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={108}>{t.clarityStandard}</option>
              <option value={150}>{t.clarityClear}</option>
              <option value={220}>{t.claritySharp}</option>
            </select>
          </div>
        </div>
      )}

      {activeTool === 'images-to-pdf' && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex-1 min-w-[220px] max-w-sm">
            <label
              htmlFor="img-to-pdf-size"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <LayoutTemplate className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" aria-hidden="true" />
              <span>{t.imgToPdfSizeLabel}</span>
            </label>
            <select
              id="img-to-pdf-size"
              value={imagesToPdf.pageSize}
              onChange={(e) =>
                onChangeImagesToPdf({
                  pageSize: e.target.value as ImagesToPdfOptions['pageSize'],
                })
              }
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="a4">{t.paperA4}</option>
              <option value="letter">{t.paperLetter}</option>
              <option value="fit">{t.paperFit}</option>
            </select>
          </div>
          <p className="text-sm text-zinc-600 dark:text-[#a7b5be]">{t.imgToPdfHint}</p>
        </div>
      )}

      {activeTool === 'word-to-pdf' && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-blue-100/80 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <FileType2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-sm text-zinc-700 dark:text-[#d6e0e5]">{t.wordToPdfHint}</p>
        </div>
      )}

      {activeTool === 'pdf-to-word' && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-sky-100/80 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
            <FileOutput className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="text-sm text-zinc-700 dark:text-[#d6e0e5]">{t.pdfToWordHint}</p>
        </div>
      )}

      {activeTool === 'rotate' && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-[#f2f6f7]">
              <RotateCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" aria-hidden="true" />
              <span>{t.rotateTitle}</span>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-[#a7b5be] mt-0.5">{t.rotateHint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onBatchRotateAll(-90)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] border border-[#d3dedb] dark:border-[#32404a] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
              <span>{t.turnLeft}</span>
            </button>
            <button
              type="button"
              onClick={() => onBatchRotateAll(90)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] border border-[#d3dedb] dark:border-[#32404a] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
              <span>{t.turnRight}</span>
            </button>
          </div>
        </div>
      )}

      {activeTool === 'delete-pages' && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex-1 min-w-[220px] max-w-sm">
            <label
              htmlFor="delete-pages-input"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
              <span>{t.deletePagesLabel}</span>
            </label>
            <input
              id="delete-pages-input"
              type="text"
              value={deletePages.ranges}
              onChange={(e) => onChangeDeletePages({ ranges: e.target.value })}
              placeholder="2"
              className="w-full h-11 px-3.5 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <p className="text-sm text-zinc-600 dark:text-[#a7b5be]">{t.deletePagesHint}</p>
        </div>
      )}

      {activeTool === 'reorder' && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-[#f2f6f7]">
              <ArrowUpDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
              <span>{t.reorderTitle}</span>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-[#a7b5be] mt-0.5">{t.reorderHint}</p>
          </div>
          {canOpenFirstPdf && (
            <button
              type="button"
              onClick={onOpenFirstPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
              <span>{t.reorderOpenFirst}</span>
            </button>
          )}
        </div>
      )}

      {activeTool === 'page-numbers' && (
        <div className="space-y-4">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-2">
              <Hash className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
              <span>{t.pageNumbersPosLabel}</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pageNumberPositions.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => onChangePageNumbers({ ...pageNumbers, position: pos.value })}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                    pageNumbers.position === pos.value
                      ? 'bg-[#edf7f5] dark:bg-teal-950/35 border-teal-600 dark:border-teal-400 text-zinc-950 dark:text-white font-semibold'
                      : 'bg-[#f8faf9] dark:bg-[#141a1e] border-[#dce3e1] dark:border-[#2c3740] text-zinc-700 dark:text-[#d6e0e5]'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <span className="block text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5">
                {t.pageNumbersFormatLabel}
              </span>
              <div className="flex items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg">
                {(
                  [
                    ['numeric', '1, 2, 3'],
                    ['roman', 'i, ii, iii'],
                    ['dashed', '- 1 -'],
                  ] as [PageNumberFormat, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onChangePageNumbers({ ...pageNumbers, format: val })}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                      pageNumbers.format === val
                        ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                        : 'text-zinc-600 dark:text-[#a7b5be]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="pn-start"
                className="block text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
              >
                {t.pageNumbersStartLabel}
              </label>
              <input
                id="pn-start"
                type="number"
                min={1}
                value={pageNumbers.startNumber}
                onChange={(e) =>
                  onChangePageNumbers({
                    ...pageNumbers,
                    startNumber: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-full h-11 px-3.5 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5">
                <label htmlFor="pn-size">{t.pageNumbersSizeLabel}</label>
                <span className="font-mono text-xs text-zinc-500 dark:text-[#96a7b1]">
                  {pageNumbers.fontSize}px
                </span>
              </div>
              <input
                id="pn-size"
                type="range"
                min={9}
                max={22}
                value={pageNumbers.fontSize}
                onChange={(e) =>
                  onChangePageNumbers({
                    ...pageNumbers,
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full h-11 accent-teal-700 dark:accent-teal-400"
              />
            </div>
          </div>
        </div>
      )}

      {activeTool === 'watermark' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label
              htmlFor="wm-text"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <Stamp className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" aria-hidden="true" />
              <span>{t.watermarkLabel}</span>
            </label>
            <input
              id="wm-text"
              type="text"
              value={watermark.text}
              onChange={(e) => onChangeWatermark({ ...watermark, text: e.target.value })}
              placeholder="CONFIDENTIAL"
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label
              htmlFor="wm-position"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <AlignCenter className="w-4 h-4 text-zinc-500 dark:text-[#96a7b1] shrink-0" aria-hidden="true" />
              <span>{t.watermarkPlaceLabel}</span>
            </label>
            <select
              id="wm-position"
              value={watermark.position}
              onChange={(e) =>
                onChangeWatermark({
                  ...watermark,
                  position: e.target.value as WatermarkOptions['position'],
                })
              }
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="diagonal">{t.watermarkDiagonal}</option>
              <option value="header">{t.watermarkHeader}</option>
              <option value="footer">{t.watermarkFooter}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="wm-color"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <Palette className="w-4 h-4 text-zinc-500 dark:text-[#96a7b1] shrink-0" aria-hidden="true" />
              <span>{t.watermarkColorLabel}</span>
            </label>
            <select
              id="wm-color"
              value={watermark.color}
              onChange={(e) =>
                onChangeWatermark({
                  ...watermark,
                  color: e.target.value as WatermarkOptions['color'],
                })
              }
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="slate">{t.colorSlate}</option>
              <option value="red">{t.colorRed}</option>
              <option value="blue">{t.colorBlue}</option>
              <option value="black">{t.colorBlack}</option>
            </select>
          </div>
        </div>
      )}

      {activeTool === 'add-text' && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="add-text-body"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <Type className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" aria-hidden="true" />
              <span>{t.addTextInputLabel}</span>
            </label>
            <textarea
              id="add-text-body"
              rows={2}
              value={addText.text}
              onChange={(e) => onChangeAddText({ ...addText, text: e.target.value })}
              placeholder={t.addTextPlaceholder}
              className="w-full p-3 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label
                htmlFor="add-text-page"
                className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
              >
                {t.addTextPageLabel}
              </label>
              <div className="flex gap-2">
                <select
                  id="add-text-page"
                  value={addText.targetPage}
                  onChange={(e) =>
                    onChangeAddText({
                      ...addText,
                      targetPage: e.target.value as AddTextOptions['targetPage'],
                    })
                  }
                  className="flex-1 h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                >
                  <option value="first">{t.addTextPageFirst}</option>
                  <option value="all">{t.addTextPageAll}</option>
                  <option value="number">{t.addTextPageNumber}</option>
                </select>
                {addText.targetPage === 'number' && (
                  <input
                    type="number"
                    min={1}
                    aria-label={t.addTextPageNumber}
                    value={addText.pageNumber}
                    onChange={(e) =>
                      onChangeAddText({
                        ...addText,
                        pageNumber: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-16 h-10 px-2 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                  />
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="add-text-place"
                className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
              >
                {t.addTextPlaceLabel}
              </label>
              <select
                id="add-text-place"
                value={addText.placement}
                onChange={(e) =>
                  onChangeAddText({
                    ...addText,
                    placement: e.target.value as AddTextPlacement,
                  })
                }
                className="w-full h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
              >
                <option value="top-left">{t.placeTopLeft}</option>
                <option value="top-center">{t.placeTopCenter}</option>
                <option value="center">{t.placeCenter}</option>
                <option value="bottom-left">{t.placeBottomLeft}</option>
                <option value="bottom-center">{t.placeBottomCenter}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="add-text-font"
                className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
              >
                {t.addTextFontLabel}
              </label>
              <select
                id="add-text-font"
                value={addText.font}
                onChange={(e) =>
                  onChangeAddText({
                    ...addText,
                    font: e.target.value as AddTextFont,
                  })
                }
                className="w-full h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
              >
                <option value="helvetica">Helvetica</option>
                <option value="times">Times</option>
                <option value="courier">Courier</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1">
                <label htmlFor="add-text-size">{t.addTextSizeLabel}</label>
                <span className="font-mono text-zinc-500 dark:text-[#96a7b1]">
                  {addText.fontSize}px
                </span>
              </div>
              <input
                id="add-text-size"
                type="range"
                min={10}
                max={32}
                value={addText.fontSize}
                onChange={(e) =>
                  onChangeAddText({ ...addText, fontSize: Number(e.target.value) })
                }
                className="w-full h-10 accent-teal-700 dark:accent-teal-400"
              />
            </div>
          </div>
        </div>
      )}

      {activeTool === 'sign' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5">
                <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
                <span>{t.tools.sign.label}</span>
              </span>
              <div className="flex items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg">
                <button
                  type="button"
                  onClick={() => onChangeSign({ ...sign, mode: 'draw' })}
                  className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    sign.mode === 'draw'
                      ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-[#a7b5be]'
                  }`}
                >
                  {t.signModeDraw}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSign({ ...sign, mode: 'type' })}
                  className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    sign.mode === 'type'
                      ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-[#a7b5be]'
                  }`}
                >
                  {t.signModeType}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="sign-page"
                className="block text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
              >
                {t.signPageLabel}
              </label>
              <div className="flex gap-2">
                <select
                  id="sign-page"
                  value={sign.targetPage}
                  onChange={(e) =>
                    onChangeSign({
                      ...sign,
                      targetPage: e.target.value as SignOptions['targetPage'],
                    })
                  }
                  className="flex-1 h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                >
                  <option value="first">{t.addTextPageFirst}</option>
                  <option value="last">{t.signPageLast}</option>
                  <option value="number">{t.addTextPageNumber}</option>
                </select>
                {sign.targetPage === 'number' && (
                  <input
                    type="number"
                    min={1}
                    aria-label={t.addTextPageNumber}
                    value={sign.pageNumber}
                    onChange={(e) =>
                      onChangeSign({
                        ...sign,
                        pageNumber: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-16 h-10 px-2 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                  />
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="sign-corner"
                className="block text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
              >
                {t.signCornerLabel}
              </label>
              <select
                id="sign-corner"
                value={sign.placement}
                onChange={(e) =>
                  onChangeSign({
                    ...sign,
                    placement: e.target.value as SignPlacement,
                  })
                }
                className="w-full h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
              >
                <option value="bottom-right">{t.posBottomRight}</option>
                <option value="bottom-center">{t.posBottomCenter}</option>
                <option value="bottom-left">{t.posBottomLeft}</option>
              </select>
            </div>
          </div>

          {sign.mode === 'draw' ? (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-[#a7b5be]">
                  {t.signDrawPrompt}
                </span>
                <button
                  type="button"
                  onClick={clearSignaturePad}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md shrink-0"
                >
                  <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.signClearPad}</span>
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={640}
                height={180}
                aria-label={t.signDrawPrompt}
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
                className="w-full h-40 sm:h-32 bg-[#fdfdfb] border-2 border-dashed border-[#c6d2cf] dark:border-[#3b4954] rounded-lg cursor-crosshair touch-none select-none"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="sign-typed-name"
                className="block text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
              >
                {t.signTypePrompt}
              </label>
              <input
                id="sign-typed-name"
                type="text"
                value={sign.typedName}
                onChange={(e) => onChangeSign({ ...sign, typedName: e.target.value })}
                placeholder={t.signTypePlaceholder}
                className="w-full h-12 px-4 text-lg italic font-serif bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </div>
      )}

      {activeTool === 'protect' && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[240px] max-w-md">
            <label
              htmlFor="protect-password"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <Lock className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
              <span>{t.protectPasswordLabel}</span>
            </label>
            <div className="relative">
              <input
                id="protect-password"
                type={showPassword ? 'text' : 'password'}
                value={protect.userPassword}
                onChange={(e) =>
                  onChangeProtect({ ...protect, userPassword: e.target.value })
                }
                placeholder={t.protectPasswordPlaceholder}
                className="w-full h-11 ps-3.5 pe-10 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-800 dark:text-[#96a7b1] dark:hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pb-2">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-[#d6e0e5] cursor-pointer">
              <input
                type="checkbox"
                checked={protect.allowPrinting}
                onChange={(e) =>
                  onChangeProtect({ ...protect, allowPrinting: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500"
              />
              <span>{t.protectAllowPrint}</span>
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-[#d6e0e5] cursor-pointer">
              <input
                type="checkbox"
                checked={protect.allowCopying}
                onChange={(e) =>
                  onChangeProtect({ ...protect, allowCopying: e.target.checked })
                }
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500"
              />
              <span>{t.protectAllowCopy}</span>
            </label>
          </div>
        </div>
      )}

      {activeTool === 'unlock' && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[240px] max-w-md">
            <label
              htmlFor="unlock-password"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-[#e6edf0] mb-1.5"
            >
              <Unlock className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" aria-hidden="true" />
              <span>{t.unlockPasswordLabel}</span>
            </label>
            <input
              id="unlock-password"
              type="password"
              value={unlock.openPassword}
              onChange={(e) => onChangeUnlock({ openPassword: e.target.value })}
              placeholder={t.unlockPasswordPlaceholder}
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <p className="text-sm text-zinc-600 dark:text-[#a7b5be] max-w-md">{t.unlockHint}</p>
        </div>
      )}

      {activeTool === 'crop' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-[#f2f6f7]">
              <Crop className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{t.tools.crop.label}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChangeCrop({
                    ...crop,
                    preset: 'light',
                    topPct: 5,
                    rightPct: 5,
                    bottomPct: 5,
                    leftPct: 5,
                  })
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  crop.preset === 'light'
                    ? 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950 border-teal-700 dark:border-teal-400'
                    : 'bg-[#eef2f1] dark:bg-[#222b31] text-zinc-700 dark:text-[#d6e0e5] border-[#d3dedb] dark:border-[#32404a]'
                }`}
              >
                {t.cropPresetLight}
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeCrop({
                    ...crop,
                    preset: 'medium',
                    topPct: 10,
                    rightPct: 10,
                    bottomPct: 10,
                    leftPct: 10,
                  })
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  crop.preset === 'medium'
                    ? 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950 border-teal-700 dark:border-teal-400'
                    : 'bg-[#eef2f1] dark:bg-[#222b31] text-zinc-700 dark:text-[#d6e0e5] border-[#d3dedb] dark:border-[#32404a]'
                }`}
              >
                {t.cropPresetMedium}
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeCrop({
                    ...crop,
                    preset: 'header-footer',
                    topPct: 12,
                    rightPct: 2,
                    bottomPct: 12,
                    leftPct: 2,
                  })
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  crop.preset === 'header-footer'
                    ? 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950 border-teal-700 dark:border-teal-400'
                    : 'bg-[#eef2f1] dark:bg-[#222b31] text-zinc-700 dark:text-[#d6e0e5] border-[#d3dedb] dark:border-[#32404a]'
                }`}
              >
                {t.cropPresetHeaders}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
            {(
              [
                ['topPct', t.cropTopLabel, 'crop-top'],
                ['rightPct', t.cropRightLabel, 'crop-right'],
                ['bottomPct', t.cropBottomLabel, 'crop-bottom'],
                ['leftPct', t.cropLeftLabel, 'crop-left'],
              ] as const
            ).map(([field, label, id]) => (
              <div key={field}>
                <label
                  htmlFor={id}
                  className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
                >
                  {label}
                </label>
                <input
                  id={id}
                  type="number"
                  min={0}
                  max={38}
                  value={crop[field]}
                  onChange={(e) =>
                    onChangeCrop({
                      ...crop,
                      preset: 'custom',
                      [field]: Math.min(38, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                  className="w-full h-10 px-3 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                />
              </div>
            ))}

            <div>
              <label
                htmlFor="crop-pages"
                className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
              >
                {t.cropPagesLabel}
              </label>
              <select
                id="crop-pages"
                value={crop.targetPage}
                onChange={(e) =>
                  onChangeCrop({
                    ...crop,
                    targetPage: e.target.value as CropOptions['targetPage'],
                  })
                }
                className="w-full h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
              >
                <option value="all">{t.addTextPageAll}</option>
                <option value="first">{t.addTextPageFirst}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'metadata' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg">
              <button
                type="button"
                onClick={() => onChangeMetadata({ ...metadata, mode: 'edit' })}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  metadata.mode === 'edit'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be]'
                }`}
              >
                <Tags className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.metadataModeEdit}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeMetadata({ ...metadata, mode: 'wipe' })}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  metadata.mode === 'wipe'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.metadataModeWipe}</span>
              </button>
            </div>

            {canOpenFirstPdf && metadata.mode === 'edit' && (
              <button
                type="button"
                onClick={onLoadMetadataFromFirstPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-[#e6edf0] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg transition-colors"
              >
                <Tags className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <span>{t.metadataLoadCurrent}</span>
              </button>
            )}
          </div>

          {metadata.mode === 'wipe' ? (
            <p className="text-sm text-zinc-600 dark:text-[#a7b5be]">{t.metadataWipeHint}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label
                  htmlFor="meta-title"
                  className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
                >
                  {t.metadataTitleLabel}
                </label>
                <input
                  id="meta-title"
                  type="text"
                  value={metadata.title}
                  onChange={(e) => onChangeMetadata({ ...metadata, title: e.target.value })}
                  placeholder="Contract 2026"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                />
              </div>
              <div>
                <label
                  htmlFor="meta-author"
                  className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
                >
                  {t.metadataAuthorLabel}
                </label>
                <input
                  id="meta-author"
                  type="text"
                  value={metadata.author}
                  onChange={(e) => onChangeMetadata({ ...metadata, author: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                />
              </div>
              <div>
                <label
                  htmlFor="meta-subject"
                  className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
                >
                  {t.metadataSubjectLabel}
                </label>
                <input
                  id="meta-subject"
                  type="text"
                  value={metadata.subject}
                  onChange={(e) => onChangeMetadata({ ...metadata, subject: e.target.value })}
                  placeholder="Invoice"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                />
              </div>
              <div>
                <label
                  htmlFor="meta-keywords"
                  className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
                >
                  {t.metadataKeywordsLabel}
                </label>
                <input
                  id="meta-keywords"
                  type="text"
                  value={metadata.keywords}
                  onChange={(e) => onChangeMetadata({ ...metadata, keywords: e.target.value })}
                  placeholder="finance, signed"
                  className="w-full h-10 px-3 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTool === 'flatten' && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg">
              <button
                type="button"
                onClick={() => onChangeFlatten({ ...flatten, mode: 'forms' })}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  flatten.mode === 'forms'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be]'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.flattenModeForms}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeFlatten({ ...flatten, mode: 'full' })}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  flatten.mode === 'full'
                    ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-[#a7b5be]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.flattenModeFull}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#a7b5be]">
              {flatten.mode === 'forms' ? t.flattenFormsHint : t.flattenFullHint}
            </p>
          </div>

          {flatten.mode === 'full' && (
            <div className="min-w-[200px]">
              <label
                htmlFor="flatten-dpi"
                className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
              >
                {t.pdfToImgClarityLabel}
              </label>
              <select
                id="flatten-dpi"
                value={flatten.dpi}
                onChange={(e) =>
                  onChangeFlatten({ ...flatten, dpi: Number(e.target.value) })
                }
                className="w-full h-10 px-3 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
              >
                <option value={150}>{t.clarityClear}</option>
                <option value={220}>{t.claritySharp}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {activeTool === 'stamp-image' && (
        <div className="space-y-4">
          <input
            ref={stampInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const bytes = new Uint8Array(await file.arrayBuffer());
              onChangeStampImage({
                ...stampImage,
                imageBytes: bytes,
                imageMimeType: file.type || 'image/png',
                imageName: file.name,
              });
              e.target.value = '';
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => stampInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t.stampImgPickLabel}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const bytes = await createSampleStampPngBytes('APPROVED');
                  onChangeStampImage({
                    ...stampImage,
                    imageBytes: bytes,
                    imageMimeType: 'image/png',
                    imageName: 'APPROVED_stamp.png',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-zinc-800 dark:text-[#e6edf0] bg-[#eef2f1] dark:bg-[#222b31] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg transition-colors"
              >
                <ImagePlus className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" aria-hidden="true" />
                <span>{t.stampImgTrySample}</span>
              </button>
            </div>

            {stampPreviewUrl && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#f4f7f6] dark:bg-[#141a1e] border border-[#dce3e1] dark:border-[#2c3740]">
                <img
                  src={stampPreviewUrl}
                  alt={stampImage.imageName || 'Stamp'}
                  className="h-7 w-auto object-contain rounded"
                />
                <span className="text-xs font-medium text-zinc-700 dark:text-[#d6e0e5] max-w-[180px] truncate">
                  {t.stampImgSelected(stampImage.imageName)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label
                htmlFor="stamp-img-page"
                className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
              >
                {t.addTextPageLabel}
              </label>
              <div className="flex gap-2">
                <select
                  id="stamp-img-page"
                  value={stampImage.targetPage}
                  onChange={(e) =>
                    onChangeStampImage({
                      ...stampImage,
                      targetPage: e.target.value as StampImageOptions['targetPage'],
                    })
                  }
                  className="flex-1 h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                >
                  <option value="first">{t.addTextPageFirst}</option>
                  <option value="all">{t.addTextPageAll}</option>
                  <option value="number">{t.addTextPageNumber}</option>
                </select>
                {stampImage.targetPage === 'number' && (
                  <input
                    type="number"
                    min={1}
                    aria-label={t.addTextPageNumber}
                    value={stampImage.pageNumber}
                    onChange={(e) =>
                      onChangeStampImage({
                        ...stampImage,
                        pageNumber: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-16 h-10 px-2 text-sm font-mono bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
                  />
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="stamp-img-place"
                className="block text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1"
              >
                {t.addTextPlaceLabel}
              </label>
              <select
                id="stamp-img-place"
                value={stampImage.placement}
                onChange={(e) =>
                  onChangeStampImage({
                    ...stampImage,
                    placement: e.target.value as StampImagePlacement,
                  })
                }
                className="w-full h-10 px-2.5 text-sm bg-white dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg text-zinc-900 dark:text-[#f2f6f7]"
              >
                <option value="top-right">{t.posTopRight}</option>
                <option value="top-left">{t.posTopLeft}</option>
                <option value="center">{t.placeCenter}</option>
                <option value="bottom-right">{t.posBottomRight}</option>
                <option value="bottom-left">{t.posBottomLeft}</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1">
                <label htmlFor="stamp-img-width">{t.stampImgSizeLabel}</label>
                <span className="font-mono text-zinc-500 dark:text-[#96a7b1]">
                  {stampImage.widthPercent}%
                </span>
              </div>
              <input
                id="stamp-img-width"
                type="range"
                min={10}
                max={60}
                step={5}
                value={stampImage.widthPercent}
                onChange={(e) =>
                  onChangeStampImage({
                    ...stampImage,
                    widthPercent: Number(e.target.value),
                  })
                }
                className="w-full h-10 accent-teal-700 dark:accent-teal-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-[#d6e0e5] mb-1">
                <label htmlFor="stamp-img-opacity">{t.stampImgOpacityLabel}</label>
                <span className="font-mono text-zinc-500 dark:text-[#96a7b1]">
                  {Math.round(stampImage.opacity * 100)}%
                </span>
              </div>
              <input
                id="stamp-img-opacity"
                type="range"
                min={0.25}
                max={1}
                step={0.05}
                value={stampImage.opacity}
                onChange={(e) =>
                  onChangeStampImage({
                    ...stampImage,
                    opacity: Number(e.target.value),
                  })
                }
                className="w-full h-10 accent-teal-700 dark:accent-teal-400"
              />
            </div>
          </div>
        </div>
      )}

      {activeTool === 'extract' && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-[#f2f6f7]">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{t.extractTitle}</span>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-[#a7b5be] mt-0.5">{t.extractHint}</p>
          </div>
          <div className="inline-flex items-center gap-1 p-1 bg-[#eef2f1] dark:bg-[#222b31] rounded-lg">
            {(
              [
                { id: 'txt', label: t.extractTxt, icon: FileText },
                { id: 'md', label: t.extractMd, icon: FileCode },
                { id: 'json', label: t.extractJson, icon: Braces },
              ] as {
                id: ExtractFormat;
                label: string;
                icon: React.ComponentType<{ className?: string }>;
              }[]
            ).map((fmt) => {
              const FmtIcon = fmt.icon;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => onChangeExtractFormat(fmt.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    extractFormat === fmt.id
                      ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-[#a7b5be] hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  <FmtIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
