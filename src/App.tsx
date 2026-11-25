import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  HelpCircle,
  X,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { buildDynamicGuideCards, type GuideCardItem } from './utils/toolImages';
import { TopBar } from './components/TopBar';
import {
  TOOL_ICONS,
  TOOL_TINTS,
  ToolSidebar,
} from './components/ToolSidebar';
import { ToolOptionsBar } from './components/ToolOptionsBar';
import { DropZone } from './components/DropZone';
import { BatchQueueTable } from './components/BatchQueueTable';
import { InspectorPanel } from './components/InspectorPanel';
import type {
  AddTextOptions,
  BatchItem,
  CompressionOptions,
  CompressionPreset,
  CropOptions,
  DeletePagesOptions,
  ExtractFormat,
  FlattenOptions,
  ImagesToPdfOptions,
  MetadataOptions,
  OutputArtifact,
  PageEditState,
  PageNumberOptions,
  PdfToImagesOptions,
  ProtectOptions,
  SignOptions,
  SplitOptions,
  StampImageOptions,
  ToolId,
  UnlockOptions,
  WatermarkOptions,
} from './types/pdf';
import {
  buildOutputFilename,
  clampConcurrency,
  detectFileKind,
  getPresetOptions,
  summarizeBatch,
} from './utils/pdfUtils';
import {
  addPageNumbersPdf,
  addTextToPdf,
  compressImageToTargetSize,
  compressOrConvertImage,
  compressPdf,
  convertDocxToPdf,
  convertImagesToPdf,
  convertPdfToDocx,
  convertPdfToImages,
  convertTextToPdf,
  createZipFromOutputs,
  cropPdf,
  deletePagesPdf,
  editPdfMetadata,
  extractTextFromPdf,
  flattenPdf,
  getPdfPageCount,
  mergePdfsAndImages,
  protectPdf,
  readPdfMetadata,
  rotateAndOrganizePdf,
  runWithConcurrency,
  signPdf,
  splitPdf,
  stampImageOnPdf,
  uint8ToBlob,
  unlockPdf,
  watermarkPdf,
} from './services/pdfEngine';
import { generateSampleBatchFiles } from './services/sampleGenerator';
import {
  detectDeviceLanguage,
  getTranslations,
  isRtlLanguage,
  SUPPORTED_LANGUAGES,
  type LanguagePreference,
} from './i18n/translations';


function GuideIllustration({
  src,
  alt,
  FallbackIcon,
}: {
  src: string;
  alt: string;
  FallbackIcon: React.ComponentType<{ className?: string }>;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="aspect-[4/3] w-full flex items-center justify-center bg-[#eef2f1] dark:bg-[#222b31] text-zinc-500 dark:text-[#96a7b1]">
        <FallbackIcon className="w-10 h-10 opacity-80" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full object-cover block"
    />
  );
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('boltpdf_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore storage access restrictions
    }
    return 'dark';
  });

  const [languagePref, setLanguagePref] = useState<LanguagePreference>(() => {
    try {
      const saved = localStorage.getItem('boltpdf_lang_pref');
      if (
        saved === 'auto' ||
        (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved))
      ) {
        return saved as LanguagePreference;
      }
    } catch {
      // Ignore storage access restrictions
    }
    return 'auto';
  });

  const activeLang = useMemo(() => {
    if (languagePref !== 'auto') return languagePref;
    const navLanguages =
      typeof navigator !== 'undefined' ? navigator.languages : undefined;
    const navLang =
      typeof navigator !== 'undefined' ? navigator.language : undefined;
    const search =
      typeof window !== 'undefined' ? window.location.search : undefined;
    return detectDeviceLanguage(navLanguages, navLang, search);
  }, [languagePref]);

  const t = useMemo(() => getTranslations(activeLang), [activeLang]);
  const [showLocalExplain, setShowLocalExplain] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#111619' : '#f4f7f6');
    }
    try {
      localStorage.setItem('boltpdf_theme', theme);
    } catch {
      // Ignore storage access restrictions
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = activeLang;
    document.documentElement.dir = isRtlLanguage(activeLang) ? 'rtl' : 'ltr';
  }, [activeLang]);

  const handleChangeLanguagePref = (pref: LanguagePreference) => {
    setLanguagePref(pref);
    try {
      localStorage.setItem('boltpdf_lang_pref', pref);
    } catch {
      // Ignore storage access restrictions
    }
  };

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const [activeTool, setActiveTool] = useState<ToolId>('compress');
  const [concurrency, setConcurrency] = useState<number>(3);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  const [compression, setCompression] = useState<CompressionOptions>(() =>
    getPresetOptions('balanced')
  );
  const [pdfToImages, setPdfToImages] = useState<PdfToImagesOptions>({
    format: 'png',
    dpi: 150,
    quality: 0.9,
  });
  const [imagesToPdf, setImagesToPdf] = useState<ImagesToPdfOptions>({
    pageSize: 'a4',
  });
  const [mergeFilename, setMergeFilename] = useState<string>('combined_files.pdf');
  const [mergedArtifact, setMergedArtifact] = useState<{
    filename: string;
    blob: Blob;
    size: number;
  } | null>(null);
  const [split, setSplit] = useState<SplitOptions>({
    mode: 'all',
    ranges: '1-2',
  });
  const [deletePages, setDeletePages] = useState<DeletePagesOptions>({
    ranges: '2',
  });
  const [pageNumbers, setPageNumbers] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'numeric',
    startNumber: 1,
    fontSize: 12,
  });
  const [watermark, setWatermark] = useState<WatermarkOptions>({
    text: 'CONFIDENTIAL',
    fontSize: 38,
    opacity: 0.25,
    angle: 35,
    color: 'slate',
    position: 'diagonal',
  });
  const [addText, setAddText] = useState<AddTextOptions>({
    text: '',
    targetPage: 'first',
    pageNumber: 1,
    font: 'helvetica',
    fontSize: 16,
    color: 'black',
    placement: 'top-left',
    posX: 48,
    posY: 700,
  });
  const [sign, setSign] = useState<SignOptions>({
    mode: 'type',
    typedName: '',
    signaturePngBytes: null,
    targetPage: 'first',
    pageNumber: 1,
    placement: 'bottom-right',
  });
  const [protect, setProtect] = useState<ProtectOptions>({
    userPassword: '',
    allowPrinting: true,
    allowCopying: false,
  });
  const [unlock, setUnlock] = useState<UnlockOptions>({
    openPassword: '',
  });
  const [extractFormat, setExtractFormat] = useState<ExtractFormat>('txt');
  const [globalRotateDelta, setGlobalRotateDelta] = useState<number>(0);
  const [crop, setCrop] = useState<CropOptions>({
    preset: 'light',
    topPct: 5,
    rightPct: 5,
    bottomPct: 5,
    leftPct: 5,
    targetPage: 'all',
  });
  const [metadata, setMetadata] = useState<MetadataOptions>({
    mode: 'edit',
    title: '',
    author: '',
    subject: '',
    keywords: '',
  });
  const [flatten, setFlatten] = useState<FlattenOptions>({
    mode: 'forms',
    dpi: 150,
  });
  const [stampImage, setStampImage] = useState<StampImageOptions>({
    imageBytes: null,
    imageMimeType: 'image/png',
    imageName: '',
    targetPage: 'first',
    pageNumber: 1,
    placement: 'top-right',
    widthPercent: 25,
    opacity: 0.9,
  });

  const summary = useMemo(() => summarizeBatch(items), [items]);
  const activeToolCopy = t.tools[activeTool];
  const ActiveToolIcon = TOOL_ICONS[activeTool];
  const activeToolTint = TOOL_TINTS[activeTool];
  const inspectorItem = useMemo(
    () => items.find((i) => i.id === inspectorId) ?? null,
    [items, inspectorId]
  );
  const firstPdfItem = useMemo(
    () => items.find((i) => i.kind === 'pdf') ?? null,
    [items]
  );

  const handleSelectTool = (tool: ToolId) => {
    if (isProcessing) return;
    setActiveTool(tool);
    setMergedArtifact(null);
    setGlobalNotice(null);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'queued',
        progress: 0,
        error: undefined,
        outputs: [],
        outputSize: undefined,
        durationMs: undefined,
      }))
    );
  };

  const ingestRawFiles = async (
    rawFiles: { name: string; mimeType: string; bytes: Uint8Array }[]
  ) => {
    setGlobalNotice(null);
    setMergedArtifact(null);
    const created: BatchItem[] = [];

    for (const raw of rawFiles) {
      const kind = detectFileKind(raw.name, raw.mimeType);
      if (kind === 'unsupported') {
        setGlobalNotice(`${raw.name} — PDF, DOCX, PNG, JPG, WebP, TXT`);
        continue;
      }

      let pageCount: number | undefined;
      if (kind === 'pdf') {
        try {
          pageCount = await getPdfPageCount(raw.bytes);
        } catch {
          pageCount = undefined;
        }
      }

      created.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: raw.name,
        mimeType:
          raw.mimeType ||
          (kind === 'pdf'
            ? 'application/pdf'
            : kind === 'word'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : kind === 'image'
                ? 'image/png'
                : 'text/plain'),
        kind,
        originalSize: raw.bytes.byteLength,
        bytes: raw.bytes,
        pageCount,
        status: 'queued',
        progress: 0,
        outputs: [],
      });
    }

    if (created.length > 0) {
      setItems((prev) => [...prev, ...created]);
    }
  };

  const handleFilesAdded = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const raw = await Promise.all(
      arr.map(async (file) => ({
        name: file.name,
        mimeType: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
      }))
    );
    await ingestRawFiles(raw);
  };

  const handleLoadSampleBatch = async () => {
    if (isLoadingSamples || isProcessing) return;
    setIsLoadingSamples(true);
    setGlobalNotice(null);
    try {
      const samples = await generateSampleBatchFiles(activeTool === 'word-to-pdf');
      await ingestRawFiles(samples);
    } catch (err) {
      setGlobalNotice(err instanceof Error ? err.message : t.creatingSamples);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleAddTextDocument = async (title: string, body: string) => {
    const encoder = new TextEncoder();
    const safeName = title.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_|_$/g, '') || 'notes';
    const bytes = encoder.encode(`${title}\n\n${body}`);
    await ingestRawFiles([
      {
        name: `${safeName}.txt`,
        mimeType: 'text/plain',
        bytes,
      },
    ]);
  };

  const handleSelectCompressionPreset = (preset: CompressionPreset) => {
    setCompression((prev) => getPresetOptions(preset, prev.targetSizeMb));
  };

  const handleLoadMetadataFromFirstPdf = async () => {
    if (!firstPdfItem) return;
    try {
      const info = await readPdfMetadata(firstPdfItem.bytes);
      setMetadata((prev) => ({
        ...prev,
        mode: 'edit',
        ...info,
      }));
    } catch (err) {
      setGlobalNotice(err instanceof Error ? err.message : 'Could not read PDF info.');
    }
  };

  const updateItem = (id: string, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleBatchRotateAll = (delta: number) => {
    setGlobalRotateDelta((prev) => (prev + delta + 360) % 360);
    setItems((prev) =>
      prev.map((item) => {
        if (item.kind !== 'pdf') return item;
        const count = item.pageCount ?? 1;
        const baseEdits: PageEditState[] =
          item.pageEdits && item.pageEdits.length > 0
            ? item.pageEdits
            : Array.from({ length: count }, (_, i) => ({
                pageNumber: i + 1,
                rotation: 0,
                deleted: false,
              }));
        return {
          ...item,
          pageEdits: baseEdits.map((p) => ({
            ...p,
            rotation: (p.rotation + delta + 360) % 360,
          })),
        };
      })
    );
    setGlobalNotice(
      `${delta > 0 ? t.turnRight : t.turnLeft} — ${t.actionRunLabel('rotate', items.length)}`
    );
  };

  const processSingleItem = async (item: BatchItem): Promise<void> => {
    const startTime = performance.now();
    updateItem(item.id, { status: 'processing', progress: 5, error: undefined, outputs: [] });

    try {
      const outputs: OutputArtifact[] = [];

      if (activeTool === 'compress') {
        if (item.kind === 'pdf') {
          const outBytes = await compressPdf(item.bytes, compression, (p) =>
            updateItem(item.id, { progress: p })
          );
          const blob = uint8ToBlob(outBytes, 'application/pdf');
          outputs.push({
            filename: buildOutputFilename(item.name, 'smaller', 'pdf'),
            blob,
            size: blob.size,
            mimeType: 'application/pdf',
          });
        } else if (item.kind === 'image') {
          updateItem(item.id, { progress: 40 });
          if (compression.preset === 'target-size') {
            const targetRes = await compressImageToTargetSize(
              item.bytes,
              item.mimeType,
              compression.targetSizeMb,
              compression.grayscale
            );
            outputs.push({
              filename: buildOutputFilename(item.name, 'smaller', targetRes.ext),
              blob: targetRes.blob,
              size: targetRes.blob.size,
              mimeType: targetRes.targetMime,
            });
          } else {
            const targetMime =
              item.mimeType === 'image/png' && compression.preset === 'lossless'
                ? 'image/webp'
                : item.mimeType === 'image/webp'
                  ? 'image/webp'
                  : 'image/jpeg';
            const maxDim =
              compression.preset === 'maximum'
                ? 1280
                : compression.preset === 'balanced'
                  ? 1920
                  : undefined;
            const res = await compressOrConvertImage(item.bytes, item.mimeType, {
              targetMime,
              quality: compression.imageQuality,
              maxDimension: maxDim,
              grayscale: compression.grayscale,
            });
            outputs.push({
              filename: buildOutputFilename(item.name, 'smaller', res.ext),
              blob: res.blob,
              size: res.blob.size,
              mimeType: targetMime,
            });
          }
        } else {
          throw new Error('PDF / PNG / JPG / WebP');
        }
      } else if (activeTool === 'pdf-to-images') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        const pages = await convertPdfToImages(
          item.bytes,
          pdfToImages.format,
          pdfToImages.dpi,
          pdfToImages.quality,
          (p) => updateItem(item.id, { progress: p })
        );
        for (const page of pages) {
          outputs.push({
            filename: buildOutputFilename(
              item.name,
              `page_${String(page.pageNumber).padStart(2, '0')}`,
              page.ext
            ),
            blob: page.blob,
            size: page.blob.size,
            mimeType: page.blob.type,
          });
        }
      } else if (activeTool === 'images-to-pdf') {
        if (item.kind !== 'image') throw new Error('PNG / JPG / WebP');
        updateItem(item.id, { progress: 45 });
        const pdfBytes = await convertImagesToPdf(
          [{ bytes: item.bytes, mimeType: item.mimeType }],
          imagesToPdf.pageSize
        );
        const blob = uint8ToBlob(pdfBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, '', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'word-to-pdf') {
        updateItem(item.id, { progress: 40 });
        const cleanTitle = item.name.replace(/\.[^.]+$/, '');
        let pdfBytes: Uint8Array;
        if (item.kind === 'word') {
          pdfBytes = await convertDocxToPdf(item.bytes, cleanTitle);
        } else if (item.kind === 'text') {
          const decoded = new TextDecoder().decode(item.bytes);
          pdfBytes = await convertTextToPdf(decoded, cleanTitle);
        } else {
          throw new Error('DOCX / TXT');
        }
        const blob = uint8ToBlob(pdfBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, '', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'pdf-to-word') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 40 });
        const cleanTitle = item.name.replace(/\.[^.]+$/, '');
        const docxBlob = await convertPdfToDocx(item.bytes, cleanTitle);
        outputs.push({
          filename: buildOutputFilename(item.name, '', 'docx'),
          blob: docxBlob,
          size: docxBlob.size,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      } else if (activeTool === 'split') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 40 });
        const splitResults = await splitPdf(item.bytes, split.mode, split.ranges);
        for (const res of splitResults) {
          const blob = uint8ToBlob(res.bytes, 'application/pdf');
          outputs.push({
            filename: buildOutputFilename(item.name, res.suffix, 'pdf'),
            blob,
            size: blob.size,
            mimeType: 'application/pdf',
          });
        }
      } else if (activeTool === 'rotate' || activeTool === 'reorder') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const count = item.pageCount ?? (await getPdfPageCount(item.bytes));
        const edits: PageEditState[] =
          item.pageEdits && item.pageEdits.length > 0
            ? item.pageEdits
            : Array.from({ length: count }, (_, i) => ({
                pageNumber: i + 1,
                rotation: activeTool === 'rotate' ? globalRotateDelta : 0,
                deleted: false,
              }));
        const outBytes = await rotateAndOrganizePdf(item.bytes, edits);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(
            item.name,
            activeTool === 'reorder' ? 'reordered' : 'rotated',
            'pdf'
          ),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'delete-pages') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await deletePagesPdf(item.bytes, deletePages.ranges, item.pageEdits);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'edited', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'page-numbers') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await addPageNumbersPdf(item.bytes, pageNumbers);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'numbered', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'watermark') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await watermarkPdf(item.bytes, watermark);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'stamped', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'add-text') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await addTextToPdf(item.bytes, addText);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'text_added', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'sign') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await signPdf(item.bytes, sign);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'signed', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'protect') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await protectPdf(item.bytes, protect);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'protected', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'unlock') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await unlockPdf(item.bytes, unlock.openPassword);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'unlocked', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'extract') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const extracted = await extractTextFromPdf(item.bytes);
        let content = extracted.fullText;
        let mimeType = 'text/plain;charset=utf-8';
        if (extractFormat === 'md') {
          content = extracted.pages
            .map((p) => `## ${t.inspectorPageNum(p.page)}\n\n${p.text}`)
            .join('\n\n');
          mimeType = 'text/markdown;charset=utf-8';
        } else if (extractFormat === 'json') {
          content = JSON.stringify(
            { filename: item.name, pageCount: extracted.pages.length, pages: extracted.pages },
            null,
            2
          );
          mimeType = 'application/json;charset=utf-8';
        }
        const blob = new Blob([content], { type: mimeType });
        outputs.push({
          filename: buildOutputFilename(item.name, 'text', extractFormat),
          blob,
          size: blob.size,
          mimeType,
          previewText: content,
        });
      } else if (activeTool === 'crop') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await cropPdf(item.bytes, crop);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'cropped', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'metadata') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await editPdfMetadata(item.bytes, metadata);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(
            item.name,
            metadata.mode === 'wipe' ? 'clean' : 'info',
            'pdf'
          ),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'flatten') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        const outBytes = await flattenPdf(item.bytes, flatten, (p) =>
          updateItem(item.id, { progress: p })
        );
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'flattened', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      } else if (activeTool === 'stamp-image') {
        if (item.kind !== 'pdf') throw new Error('PDF file required');
        updateItem(item.id, { progress: 45 });
        const outBytes = await stampImageOnPdf(item.bytes, stampImage);
        const blob = uint8ToBlob(outBytes, 'application/pdf');
        outputs.push({
          filename: buildOutputFilename(item.name, 'stamped', 'pdf'),
          blob,
          size: blob.size,
          mimeType: 'application/pdf',
        });
      }

      const totalOutSize = outputs.reduce((acc, o) => acc + o.size, 0);
      const durationMs = Math.max(1, Math.round(performance.now() - startTime));
      updateItem(item.id, {
        status: 'done',
        progress: 100,
        outputs,
        outputSize: totalOutSize,
        durationMs,
      });
    } catch (err) {
      updateItem(item.id, {
        status: 'error',
        progress: 0,
        error: err instanceof Error ? err.message : 'Error',
      });
    }
  };

  const handleRunBatch = async () => {
    if (isProcessing || items.length === 0) return;
    setIsProcessing(true);
    setGlobalNotice(null);
    setMergedArtifact(null);

    try {
      if (activeTool === 'merge') {
        const mergeable = items.filter((i) => i.kind === 'pdf' || i.kind === 'image');
        if (mergeable.length === 0) {
          setGlobalNotice('PDF / PNG / JPG / WebP');
          return;
        }
        setItems((prev) =>
          prev.map((i) =>
            i.kind === 'pdf' || i.kind === 'image'
              ? { ...i, status: 'processing', progress: 35, error: undefined }
              : { ...i, status: 'error', error: 'PDF / PNG / JPG' }
          )
        );
        const mergedBytes = await mergePdfsAndImages(
          mergeable.map((m) => ({
            bytes: m.bytes,
            kind: m.kind === 'pdf' ? 'pdf' : 'image',
            mimeType: m.mimeType,
          }))
        );
        const finalName = mergeFilename.trim().toLowerCase().endsWith('.pdf')
          ? mergeFilename.trim()
          : `${mergeFilename.trim() || 'combined_files'}.pdf`;
        const blob = uint8ToBlob(mergedBytes, 'application/pdf');
        setMergedArtifact({ filename: finalName, blob, size: blob.size });
        setItems((prev) =>
          prev.map((i) =>
            i.kind === 'pdf' || i.kind === 'image'
              ? {
                  ...i,
                  status: 'done',
                  progress: 100,
                  outputSize: blob.size,
                  outputs: [
                    {
                      filename: finalName,
                      blob,
                      size: blob.size,
                      mimeType: 'application/pdf',
                    },
                  ],
                }
              : i
          )
        );
        return;
      }

      const snapshot = [...items];
      await runWithConcurrency(snapshot, clampConcurrency(concurrency), async (item) => {
        await processSingleItem(item);
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadItem = async (item: BatchItem) => {
    if (item.outputs.length === 0) return;
    if (item.outputs.length === 1) {
      triggerBlobDownload(item.outputs[0].blob, item.outputs[0].filename);
      return;
    }
    const zipBlob = await createZipFromOutputs(
      item.outputs.map((o) => ({ filename: o.filename, blob: o.blob }))
    );
    triggerBlobDownload(zipBlob, buildOutputFilename(item.name, 'files', 'zip'));
  };

  const handleDownloadAllZip = async () => {
    const allOutputs = items.flatMap((item) =>
      item.outputs.map((o) => ({ filename: o.filename, blob: o.blob }))
    );
    if (allOutputs.length === 0) return;
    const zipBlob = await createZipFromOutputs(allOutputs);
    triggerBlobDownload(zipBlob, `largepdf_${activeTool}_files.zip`);
  };

  const handleChainToTool = async (nextTool: ToolId, singleItem?: BatchItem) => {
    if (isProcessing) return;

    const isCompatibleOutput = (mimeType: string): boolean => {
      if (nextTool === 'images-to-pdf') return mimeType.startsWith('image/');
      if (nextTool === 'compress' || nextTool === 'merge') {
        return mimeType === 'application/pdf' || mimeType.startsWith('image/');
      }
      if (nextTool === 'word-to-pdf') return false;
      return mimeType === 'application/pdf';
    };

    const sourceArtifacts: { filename: string; blob: Blob; mimeType: string }[] = [];

    if (singleItem) {
      for (const out of singleItem.outputs) {
        if (isCompatibleOutput(out.mimeType)) {
          sourceArtifacts.push(out);
        }
      }
    } else if (activeTool === 'merge' && mergedArtifact) {
      if (isCompatibleOutput('application/pdf')) {
        sourceArtifacts.push({
          filename: mergedArtifact.filename,
          blob: mergedArtifact.blob,
          mimeType: 'application/pdf',
        });
      }
    } else {
      for (const item of items) {
        if (item.status !== 'done') continue;
        for (const out of item.outputs) {
          if (isCompatibleOutput(out.mimeType)) {
            sourceArtifacts.push(out);
          }
        }
      }
    }

    if (sourceArtifacts.length === 0) {
      setGlobalNotice(t.tools[nextTool].actionHint);
      return;
    }

    const rawNext = await Promise.all(
      sourceArtifacts.map(async (art) => ({
        name: art.filename,
        mimeType: art.mimeType,
        bytes: new Uint8Array(await art.blob.arrayBuffer()),
      }))
    );

    const nextItems: BatchItem[] = [];
    for (const raw of rawNext) {
      const kind = detectFileKind(raw.name, raw.mimeType);
      if (kind === 'unsupported') continue;
      let pageCount: number | undefined;
      if (kind === 'pdf') {
        try {
          pageCount = await getPdfPageCount(raw.bytes);
        } catch {
          pageCount = undefined;
        }
      }
      nextItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: raw.name,
        mimeType: raw.mimeType,
        kind,
        originalSize: raw.bytes.byteLength,
        bytes: raw.bytes,
        pageCount,
        status: 'queued',
        progress: 0,
        outputs: [],
      });
    }

    if (nextItems.length === 0) return;

    setMergedArtifact(null);
    setInspectorId(null);
    setActiveTool(nextTool);
    setItems(nextItems);
    setGlobalNotice(t.chainedNotice(nextItems.length, t.tools[nextTool].label));
  };

  const handleMoveItem = (id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const handleUpdatePageEdits = (itemId: string, edits: PageEditState[]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, pageEdits: edits } : item))
    );
  };

  const handleApplyOrganizeExport = async (item: BatchItem, edits: PageEditState[]) => {
    try {
      const outBytes = await rotateAndOrganizePdf(item.bytes, edits);
      const blob = uint8ToBlob(outBytes, 'application/pdf');
      const filename = buildOutputFilename(item.name, 'updated', 'pdf');
      triggerBlobDownload(blob, filename);
    } catch (err) {
      setGlobalNotice(err instanceof Error ? err.message : 'Error');
    }
  };

  const actionLabel = useMemo(
    () => t.actionRunLabel(activeTool, items.length),
    [t, activeTool, items.length]
  );

  const guideCards = useMemo(
    () => buildDynamicGuideCards(activeTool, t),
    [activeTool, t]
  );

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col bg-[#f4f7f6] dark:bg-[#111619] text-zinc-900 dark:text-[#f2f6f7]"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesAdded(e.target.files);
            e.target.value = '';
          }
        }}
      />

      <TopBar
        onSelectTool={handleSelectTool}
        onTriggerUpload={() => fileInputRef.current?.click()}
        theme={theme}
        onToggleTheme={toggleTheme}
        languagePref={languagePref}
        onChangeLanguagePref={handleChangeLanguagePref}
        t={t}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        <ToolSidebar
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          concurrency={concurrency}
          onChangeConcurrency={(v) => setConcurrency(clampConcurrency(v))}
          t={t}
        />

        <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 sm:space-y-6">
          {/* Workspace Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-3 border-b border-[#dce3e1] dark:border-[#2c3740]">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activeToolTint.badge}`}
              >
                <ActiveToolIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
                  {activeToolCopy.label}
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-[#a7b5be] mt-0.5 max-w-2xl">
                  {activeToolCopy.actionHint}
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-zinc-500 dark:text-[#96a7b1] flex flex-wrap items-center gap-x-2 gap-y-1 shrink-0">
              <button
                type="button"
                aria-expanded={showLocalExplain}
                aria-label={t.localProcessingBtnAria}
                onClick={() => setShowLocalExplain((v) => !v)}
                className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:py-1 -ms-2 sm:ms-0 rounded-md hover:bg-[#e5ecea] dark:hover:bg-[#222b31] hover:text-zinc-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{t.privateOnDevice}</span>
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-[#7c8f99] shrink-0" aria-hidden="true" />
              </button>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <InfinityIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>{t.noFileLimits}</span>
              </span>
            </div>
          </div>

          {showLocalExplain && (
            <div
              role="region"
              aria-label={t.localProcessingTitle}
              className="px-4 py-3.5 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/70 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-2.5">
                <ShieldCheck
                  className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                    {t.localProcessingTitle}
                  </p>
                  <p className="text-sm text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                    {t.localProcessingExplain}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocalExplain(false)}
                aria-label={t.closeNotice}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {globalNotice && (
            <div
              role="status"
              className="px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4"
            >
              <span>{globalNotice}</span>
              <button
                type="button"
                onClick={() => setGlobalNotice(null)}
                className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline shrink-0"
              >
                {t.closeNotice}
              </button>
            </div>
          )}

          {/* Step 1 / Contextual Tool Settings */}
          <ToolOptionsBar
            activeTool={activeTool}
            compression={compression}
            onChangeCompression={setCompression}
            onSelectCompressionPreset={handleSelectCompressionPreset}
            pdfToImages={pdfToImages}
            onChangePdfToImages={setPdfToImages}
            imagesToPdf={imagesToPdf}
            onChangeImagesToPdf={setImagesToPdf}
            mergeFilename={mergeFilename}
            onChangeMergeFilename={setMergeFilename}
            split={split}
            onChangeSplit={setSplit}
            deletePages={deletePages}
            onChangeDeletePages={setDeletePages}
            crop={crop}
            onChangeCrop={setCrop}
            metadata={metadata}
            onChangeMetadata={setMetadata}
            onLoadMetadataFromFirstPdf={handleLoadMetadataFromFirstPdf}
            flatten={flatten}
            onChangeFlatten={setFlatten}
            stampImage={stampImage}
            onChangeStampImage={setStampImage}
            pageNumbers={pageNumbers}
            onChangePageNumbers={setPageNumbers}
            watermark={watermark}
            onChangeWatermark={setWatermark}
            addText={addText}
            onChangeAddText={setAddText}
            sign={sign}
            onChangeSign={setSign}
            protect={protect}
            onChangeProtect={setProtect}
            unlock={unlock}
            onChangeUnlock={setUnlock}
            extractFormat={extractFormat}
            onChangeExtractFormat={setExtractFormat}
            onBatchRotateAll={handleBatchRotateAll}
            canOpenFirstPdf={firstPdfItem !== null}
            onOpenFirstPdf={() => {
              if (firstPdfItem) setInspectorId(firstPdfItem.id);
            }}
            t={t}
          />

          {/* Step 2 / File Intake */}
          <DropZone
            onFilesAdded={handleFilesAdded}
            showTextComposer={activeTool === 'word-to-pdf'}
            onAddTextDocument={handleAddTextDocument}
            compact={items.length > 0}
            t={t}
          />

          {/* Step 3 / Selected Files & Run */}
          <BatchQueueTable
            items={items}
            summary={summary}
            activeTool={activeTool}
            isProcessing={isProcessing}
            actionLabel={actionLabel}
            onRunBatch={handleRunBatch}
            onDownloadItem={handleDownloadItem}
            onDownloadAllZip={handleDownloadAllZip}
            onChainToTool={handleChainToTool}
            onPreviewItem={(item) => setInspectorId(item.id)}
            onMoveItem={handleMoveItem}
            onRemoveItem={(id) => {
              setItems((prev) => prev.filter((x) => x.id !== id));
              if (inspectorId === id) setInspectorId(null);
            }}
            onClearCompleted={() =>
              setItems((prev) => prev.filter((x) => x.status !== 'done'))
            }
            onClearAll={() => {
              setItems([]);
              setMergedArtifact(null);
              setInspectorId(null);
            }}
            mergedArtifact={mergedArtifact}
            onDownloadMerged={() => {
              if (mergedArtifact) {
                triggerBlobDownload(mergedArtifact.blob, mergedArtifact.filename);
              }
            }}
            t={t}
          />

          {/* Grounded Documentary Photo Guide (when queue is empty) */}
          {items.length === 0 && (
            <section
              aria-label="How it works"
              className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2"
            >
              {guideCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.id}
                    className="bg-white dark:bg-[#181f24] border border-[#dce3e1] dark:border-[#2c3740] rounded-lg overflow-hidden flex flex-col"
                  >
                    <div className="border-b border-[#dce3e1] dark:border-[#2c3740] bg-[#eef2f1] dark:bg-[#222b31]">
                      <GuideIllustration
                        src={card.imageSrc}
                        alt={card.title}
                        FallbackIcon={Icon}
                      />
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${card.iconColor}`}
                          aria-hidden="true"
                        />
                        <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-[#f2f6f7]">
                          {card.stepNum} {card.title}
                        </h2>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-[#a7b5be] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          <footer className="pt-4 border-t border-[#dce3e1] dark:border-[#2c3740] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-[#7c8f99]">
            <span>{t.footerNote}</span>
            <span>{t.privateOnDevice}</span>
          </footer>
        </main>
      </div>

      <InspectorPanel
        item={inspectorItem}
        onClose={() => setInspectorId(null)}
        onUpdatePageEdits={handleUpdatePageEdits}
        onApplyOrganizeExport={handleApplyOrganizeExport}
        onDownloadItem={handleDownloadItem}
        t={t}
      />
    </div>
  );
}
