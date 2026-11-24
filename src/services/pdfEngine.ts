import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import type {
  AddTextFont,
  AddTextOptions,
  CompressionOptions,
  CropOptions,
  FlattenOptions,
  MetadataOptions,
  PageEditState,
  PageNumberOptions,
  ProtectOptions,
  SignOptions,
  StampImageOptions,
  WatermarkOptions,
} from '../types/pdf';
import {
  buildTargetCompressionSteps,
  computeCroppedBox,
  computeDeleteKeepIndices,
  escapeXml,
  formatPageNumberText,
  isWinAnsiEncodable,
  mbToBytes,
  parsePageRanges,
  sanitizeForWinAnsi,
} from '../utils/pdfUtils';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function uint8ToBlob(bytes: Uint8Array, mimeType: string): Blob {
  return new Blob([toArrayBuffer(bytes)], { type: mimeType });
}

export async function getPdfPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function renderPdfThumbnails(
  bytes: Uint8Array,
  maxPages = 24,
  scale = 0.45
): Promise<{ pageNumber: number; dataUrl: string; width: number; height: number }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const count = Math.min(pdf.numPages, maxPages);
  const thumbs: { pageNumber: number; dataUrl: string; width: number; height: number }[] = [];

  for (let i = 1; i <= count; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    }
    thumbs.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/jpeg', 0.78),
      width: canvas.width,
      height: canvas.height,
    });
    page.cleanup();
  }

  await loadingTask.destroy();
  return thumbs;
}

export async function renderPdfSinglePage(
  bytes: Uint8Array,
  pageNumber = 1,
  scale = 1.6
): Promise<{ dataUrl: string; totalPages: number; width: number; height: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const safePage = Math.min(totalPages, Math.max(1, Math.floor(pageNumber)));
  const page = await pdf.getPage(safePage);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  }
  const dataUrl = canvas.toDataURL('image/png');
  page.cleanup();
  await loadingTask.destroy();
  return { dataUrl, totalPages, width: canvas.width, height: canvas.height };
}

async function losslessOptimizePdf(
  bytes: Uint8Array,
  stripMetadata: boolean
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const targetDoc = await PDFDocument.create();
  const pageIndices = sourceDoc.getPageIndices();
  const copiedPages = await targetDoc.copyPages(sourceDoc, pageIndices);
  for (const page of copiedPages) {
    targetDoc.addPage(page);
  }

  if (stripMetadata) {
    targetDoc.setTitle('');
    targetDoc.setAuthor('');
    targetDoc.setSubject('');
    targetDoc.setKeywords([]);
    targetDoc.setCreator('LargePDF');
    targetDoc.setProducer('LargePDF');
  }

  return targetDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });
}

function applyGrayscale(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);
}

async function canvasToUint8Array(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas encoding failed.'));
      },
      mimeType,
      quality
    );
  });
  return new Uint8Array(await blob.arrayBuffer());
}

export async function compressPdf(
  bytes: Uint8Array,
  options: CompressionOptions,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  onProgress?.(10);

  if (options.preset === 'lossless') {
    const result = await losslessOptimizePdf(bytes, options.stripMetadata);
    onProgress?.(100);
    return result.byteLength < bytes.byteLength ? result : bytes;
  }

  if (options.preset === 'target-size') {
    const targetBytes = mbToBytes(options.targetSizeMb);
    const losslessCandidate = await losslessOptimizePdf(bytes, options.stripMetadata);
    const bestNonRaster =
      losslessCandidate.byteLength <= bytes.byteLength ? losslessCandidate : bytes;
    if (bestNonRaster.byteLength <= targetBytes && !options.grayscale) {
      onProgress?.(100);
      return bestNonRaster;
    }

    // Render all pages once at 150 DPI, then test decreasing quality/scale passes quickly in memory
    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const renderedPages: {
      canvas: HTMLCanvasElement;
      baseWidth: number;
      baseHeight: number;
    }[] = [];
    const baseScale = 150 / 72;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const baseViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale: baseScale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(renderViewport.width));
      canvas.height = Math.max(1, Math.floor(renderViewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to create 2D canvas context.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;
      if (options.grayscale) {
        applyGrayscale(ctx, canvas.width, canvas.height);
      }
      renderedPages.push({
        canvas,
        baseWidth: baseViewport.width,
        baseHeight: baseViewport.height,
      });
      page.cleanup();
      onProgress?.(Math.min(55, Math.round(15 + (i / totalPages) * 40)));
    }
    await loadingTask.destroy();

    const steps = buildTargetCompressionSteps();
    let smallestBytes: Uint8Array = bestNonRaster;

    for (let sIdx = 0; sIdx < steps.length; sIdx++) {
      const step = steps[sIdx];
      const attemptDoc = await PDFDocument.create();
      if (options.stripMetadata) {
        attemptDoc.setCreator('LargePDF');
        attemptDoc.setProducer('LargePDF');
      }

      for (const p of renderedPages) {
        let sourceCanvas = p.canvas;
        if (step.scaleRatio < 0.99) {
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.max(1, Math.round(p.canvas.width * step.scaleRatio));
          scaledCanvas.height = Math.max(1, Math.round(p.canvas.height * step.scaleRatio));
          const sCtx = scaledCanvas.getContext('2d');
          if (sCtx) {
            sCtx.imageSmoothingEnabled = true;
            sCtx.imageSmoothingQuality = 'high';
            sCtx.drawImage(p.canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            sourceCanvas = scaledCanvas;
          }
        }
        const jpgBytes = await canvasToUint8Array(sourceCanvas, 'image/jpeg', step.quality);
        const embedded = await attemptDoc.embedJpg(jpgBytes);
        const outPage = attemptDoc.addPage([p.baseWidth, p.baseHeight]);
        outPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: p.baseWidth,
          height: p.baseHeight,
        });
      }

      const attemptBytes = await attemptDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      if (attemptBytes.byteLength < smallestBytes.byteLength) {
        smallestBytes = attemptBytes;
      }
      onProgress?.(Math.min(96, Math.round(58 + ((sIdx + 1) / steps.length) * 38)));

      if (attemptBytes.byteLength <= targetBytes) {
        onProgress?.(100);
        return attemptBytes;
      }
    }

    onProgress?.(100);
    return smallestBytes;
  }

  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const targetDoc = await PDFDocument.create();
  const scale = Math.max(0.5, options.dpi / 72);

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(renderViewport.width));
    canvas.height = Math.max(1, Math.floor(renderViewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to create 2D canvas context.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

    if (options.grayscale) {
      applyGrayscale(ctx, canvas.width, canvas.height);
    }

    const jpegBytes = await canvasToUint8Array(canvas, 'image/jpeg', options.imageQuality);
    const embeddedImage = await targetDoc.embedJpg(jpegBytes);
    const outPage = targetDoc.addPage([baseViewport.width, baseViewport.height]);
    outPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });

    page.cleanup();
    onProgress?.(Math.min(92, Math.round(15 + (i / totalPages) * 75)));
  }

  await loadingTask.destroy();

  if (options.stripMetadata) {
    targetDoc.setCreator('LargePDF');
    targetDoc.setProducer('LargePDF');
  }

  const rasterizedBytes = await targetDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  if (options.preset === 'balanced' && !options.grayscale) {
    const losslessBytes = await losslessOptimizePdf(bytes, options.stripMetadata);
    onProgress?.(100);
    if (
      losslessBytes.byteLength < rasterizedBytes.byteLength &&
      losslessBytes.byteLength < bytes.byteLength
    ) {
      return losslessBytes;
    }
    return rasterizedBytes.byteLength < bytes.byteLength ? rasterizedBytes : losslessBytes;
  }

  onProgress?.(100);
  return rasterizedBytes;
}

async function decodeImageElement(bytes: Uint8Array, mimeType: string): Promise<HTMLImageElement> {
  const blob = uint8ToBlob(bytes, mimeType || 'image/png');
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressOrConvertImage(
  bytes: Uint8Array,
  sourceMime: string,
  options: {
    targetMime: 'image/jpeg' | 'image/webp' | 'image/png';
    quality: number;
    maxDimension?: number;
    grayscale?: boolean;
  }
): Promise<{ blob: Blob; ext: string }> {
  const img = await decodeImageElement(bytes, sourceMime);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (options.maxDimension && (width > options.maxDimension || height > options.maxDimension)) {
    const ratio = Math.min(options.maxDimension / width, options.maxDimension / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to initialize canvas.');

  if (options.targetMime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  if (options.grayscale) {
    applyGrayscale(ctx, width, height);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image export failed.'))),
      options.targetMime,
      options.quality
    );
  });

  const ext =
    options.targetMime === 'image/webp'
      ? 'webp'
      : options.targetMime === 'image/png'
        ? 'png'
        : 'jpg';

  return { blob, ext };
}

export async function compressImageToTargetSize(
  bytes: Uint8Array,
  sourceMime: string,
  targetSizeMb: number,
  grayscale: boolean
): Promise<{ blob: Blob; ext: string; targetMime: 'image/jpeg' | 'image/webp' }> {
  const targetBytes = mbToBytes(targetSizeMb);
  const targetMime: 'image/jpeg' | 'image/webp' =
    sourceMime === 'image/webp' ? 'image/webp' : 'image/jpeg';

  if (bytes.byteLength <= targetBytes && !grayscale) {
    const ext = sourceMime === 'image/png' ? 'png' : sourceMime === 'image/webp' ? 'webp' : 'jpg';
    const safeBlob = uint8ToBlob(bytes, sourceMime || 'image/jpeg');
    if (sourceMime !== 'image/png') {
      return { blob: safeBlob, ext, targetMime };
    }
  }

  const attempts: { maxDim: number; quality: number }[] = [
    { maxDim: 2200, quality: 0.88 },
    { maxDim: 1800, quality: 0.76 },
    { maxDim: 1400, quality: 0.64 },
    { maxDim: 1100, quality: 0.5 },
    { maxDim: 820, quality: 0.38 },
  ];

  let smallest: { blob: Blob; ext: string } | null = null;
  for (const step of attempts) {
    const res = await compressOrConvertImage(bytes, sourceMime, {
      targetMime,
      quality: step.quality,
      maxDimension: step.maxDim,
      grayscale,
    });
    if (!smallest || res.blob.size < smallest.blob.size) {
      smallest = res;
    }
    if (res.blob.size <= targetBytes) {
      return { ...res, targetMime };
    }
  }

  return { ...(smallest as { blob: Blob; ext: string }), targetMime };
}

export async function convertPdfToImages(
  bytes: Uint8Array,
  format: 'png' | 'jpeg' | 'webp',
  dpi: number,
  quality: number,
  onProgress?: (percent: number) => void
): Promise<{ pageNumber: number; blob: Blob; ext: string }[]> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const scale = Math.max(0.75, dpi / 72);
  const mime =
    format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const ext = format === 'jpeg' ? 'jpg' : format;
  const results: { pageNumber: number; blob: Blob; ext: string }[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode page image.'))),
        mime,
        quality
      );
    });

    results.push({ pageNumber: i, blob, ext });
    page.cleanup();
    onProgress?.(Math.round((i / total) * 100));
  }

  await loadingTask.destroy();
  return results;
}

async function embedAnyImageIntoPdf(
  pdfDoc: PDFDocument,
  bytes: Uint8Array,
  mimeType: string
) {
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') {
    return pdfDoc.embedJpg(bytes);
  }
  if (normalized === 'image/png') {
    return pdfDoc.embedPng(bytes);
  }
  const converted = await compressOrConvertImage(bytes, mimeType, {
    targetMime: 'image/png',
    quality: 0.95,
  });
  return pdfDoc.embedPng(new Uint8Array(await converted.blob.arrayBuffer()));
}

export async function convertImagesToPdf(
  images: { bytes: Uint8Array; mimeType: string }[],
  pageSize: 'fit' | 'a4' | 'letter'
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setCreator('LargePDF');
  doc.setProducer('LargePDF');

  for (const imgInput of images) {
    const embedded = await embedAnyImageIntoPdf(doc, imgInput.bytes, imgInput.mimeType);
    const dims = embedded.scale(1);

    if (pageSize === 'fit') {
      const page = doc.addPage([dims.width, dims.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: dims.width, height: dims.height });
    } else {
      const [pageW, pageH] = pageSize === 'a4' ? [595.28, 841.89] : [612, 792];
      const margin = 36;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const fitScale = Math.min(maxW / dims.width, maxH / dims.height, 1);
      const drawW = dims.width * fitScale;
      const drawH = dims.height * fitScale;
      const page = doc.addPage([pageW, pageH]);
      page.drawImage(embedded, {
        x: (pageW - drawW) / 2,
        y: (pageH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }
  }

  return doc.save({ useObjectStreams: true });
}

async function renderTextBlockPng(
  text: string,
  options: { fontSize: number; colorCss: string; italic?: boolean; maxWidth?: number }
): Promise<{ pngBytes: Uint8Array; width: number; height: number }> {
  const scale = 2;
  const paddingX = 8;
  const paddingY = 6;
  const fontFamily = options.italic
    ? 'Georgia, "Times New Roman", serif'
    : 'system-ui, -apple-system, "Segoe UI", sans-serif';
  const fontDecl = `${options.italic ? 'italic ' : ''}${options.fontSize * scale}px ${fontFamily}`;

  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d')!;
  mCtx.font = fontDecl;

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let maxW = 20;
  for (const line of lines) {
    const w = mCtx.measureText(line || ' ').width;
    if (w > maxW) maxW = w;
  }

  const lineH = Math.round(options.fontSize * 1.4 * scale);
  const width = Math.min(
    (options.maxWidth ?? 520) * scale,
    Math.max(40, Math.ceil(maxW) + paddingX * 2 * scale)
  );
  const height = Math.max(24, lines.length * lineH + paddingY * 2 * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontDecl;
  ctx.fillStyle = options.colorCss;
  ctx.textBaseline = 'top';

  lines.forEach((line, idx) => {
    ctx.fillText(line, paddingX * scale, paddingY * scale + idx * lineH);
  });

  const pngBytes = await canvasToUint8Array(canvas, 'image/png', 1);
  return { pngBytes, width: width / scale, height: height / scale };
}

export async function convertTextToPdf(text: string, title?: string): Promise<Uint8Array> {
  const cleanTitle = sanitizeForWinAnsi(title ?? '');
  const cleanText = sanitizeForWinAnsi(text);

  if (!isWinAnsiEncodable(cleanTitle) || !isWinAnsiEncodable(cleanText)) {
    // Fallback canvas-based pages so Arabic or non-Latin Word/Text files never fail
    const doc = await PDFDocument.create();
    const lines = `${title ? `${title}\n\n` : ''}${text}`.replace(/\r\n/g, '\n').split('\n');
    const chunkSize = 26;
    for (let start = 0; start < lines.length; start += chunkSize) {
      const chunk = lines.slice(start, start + chunkSize).join('\n');
      const rendered = await renderTextBlockPng(chunk, {
        fontSize: 13,
        colorCss: '#18181b',
        maxWidth: 510,
      });
      const img = await doc.embedPng(rendered.pngBytes);
      const page = doc.addPage([595.28, 841.89]);
      page.drawImage(img, {
        x: 44,
        y: 841.89 - 48 - rendered.height,
        width: rendered.width,
        height: rendered.height,
      });
    }
    return doc.save({ useObjectStreams: true });
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  if (cleanTitle && cleanTitle.trim()) {
    page.drawText(cleanTitle.trim().slice(0, 90), {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.08, 0.12, 0.2),
    });
    y -= 28;
  }

  const rawLines = cleanText.replace(/\r\n/g, '\n').split('\n');
  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      y -= lineHeight * 0.7;
      if (y < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      continue;
    }

    const words = rawLine.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width > contentWidth && currentLine) {
        if (y < margin) {
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.15, 0.2, 0.28),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }

    if (currentLine) {
      if (y < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.15, 0.2, 0.28),
      });
      y -= lineHeight;
    }
  }

  return doc.save({ useObjectStreams: true });
}

export async function mergePdfsAndImages(
  inputs: { bytes: Uint8Array; kind: 'pdf' | 'image'; mimeType: string }[],
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  merged.setCreator('LargePDF');
  merged.setProducer('LargePDF');

  for (let i = 0; i < inputs.length; i++) {
    const item = inputs[i];
    if (item.kind === 'pdf') {
      const src = await PDFDocument.load(item.bytes, { ignoreEncryption: true });
      const copied = await merged.copyPages(src, src.getPageIndices());
      for (const p of copied) merged.addPage(p);
    } else if (item.kind === 'image') {
      const embedded = await embedAnyImageIntoPdf(merged, item.bytes, item.mimeType);
      const dims = embedded.scale(1);
      const page = merged.addPage([dims.width, dims.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: dims.width, height: dims.height });
    }
    onProgress?.(Math.round(((i + 1) / inputs.length) * 95));
  }

  const out = await merged.save({ useObjectStreams: true });
  onProgress?.(100);
  return out;
}

export async function splitPdf(
  bytes: Uint8Array,
  mode: 'all' | 'ranges',
  rangeString: string
): Promise<{ suffix: string; bytes: Uint8Array }[]> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = src.getPageCount();

  if (mode === 'all') {
    const outputs: { suffix: string; bytes: Uint8Array }[] = [];
    for (let i = 0; i < totalPages; i++) {
      const single = await PDFDocument.create();
      const [copied] = await single.copyPages(src, [i]);
      single.addPage(copied);
      outputs.push({
        suffix: `page_${String(i + 1).padStart(2, '0')}`,
        bytes: await single.save({ useObjectStreams: true }),
      });
    }
    return outputs;
  }

  const selectedOneBased = parsePageRanges(rangeString, totalPages);
  const subset = await PDFDocument.create();
  const zeroBased = selectedOneBased.map((p) => p - 1);
  const copiedPages = await subset.copyPages(src, zeroBased);
  for (const p of copiedPages) subset.addPage(p);

  return [
    {
      suffix: `pages_${selectedOneBased[0]}-${selectedOneBased[selectedOneBased.length - 1]}`,
      bytes: await subset.save({ useObjectStreams: true }),
    },
  ];
}

export async function deletePagesPdf(
  bytes: Uint8Array,
  deleteRanges: string,
  pageEdits?: PageEditState[]
): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = src.getPageCount();

  let keepOneBased: number[];
  if (pageEdits && pageEdits.some((e) => e.deleted)) {
    const kept = pageEdits.filter((e) => !e.deleted).map((e) => e.pageNumber);
    if (kept.length === 0) {
      throw new Error('Cannot delete every page. Keep at least 1 page.');
    }
    keepOneBased = kept;
  } else {
    keepOneBased = computeDeleteKeepIndices(totalPages, deleteRanges);
  }

  const out = await PDFDocument.create();
  const zeroBased = keepOneBased.map((p) => p - 1);
  const copied = await out.copyPages(src, zeroBased);
  for (const page of copied) {
    out.addPage(page);
  }

  return out.save({ useObjectStreams: true });
}

export async function rotateAndOrganizePdf(
  bytes: Uint8Array,
  pageEdits: PageEditState[]
): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const kept = pageEdits.filter((e) => !e.deleted);
  if (kept.length === 0) {
    throw new Error('Cannot save PDF with all pages deleted.');
  }

  const out = await PDFDocument.create();
  const indices = kept.map((e) => e.pageNumber - 1);
  const copied = await out.copyPages(src, indices);

  copied.forEach((page, idx) => {
    const edit = kept[idx];
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + edit.rotation) % 360));
    out.addPage(page);
  });

  return out.save({ useObjectStreams: true });
}

export async function addPageNumbersPdf(
  bytes: Uint8Array,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const margin = 36;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const label = formatPageNumberText(options.startNumber + i, options.format);
    const textWidth = font.widthOfTextAtSize(label, options.fontSize);

    let x = (width - textWidth) / 2;
    let y = margin;

    switch (options.position) {
      case 'bottom-left':
        x = margin;
        y = margin;
        break;
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = margin;
        break;
      case 'bottom-right':
        x = width - margin - textWidth;
        y = margin;
        break;
      case 'top-left':
        x = margin;
        y = height - margin - options.fontSize;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - margin - options.fontSize;
        break;
      case 'top-right':
        x = width - margin - textWidth;
        y = height - margin - options.fontSize;
        break;
    }

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.25, 0.28, 0.34),
    });
  }

  return doc.save({ useObjectStreams: true });
}

export async function protectPdf(
  bytes: Uint8Array,
  options: ProtectOptions
): Promise<Uint8Array> {
  const password = options.userPassword.trim();
  if (!password) {
    throw new Error('Please enter a password.');
  }

  // Ensure standard uncompressed/compatible pdf-lib output before RC4-128 encryption
  const cleanDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const preparedBytes = await cleanDoc.save({ useObjectStreams: false });

  return encryptPDF(preparedBytes, password, {
    ownerPassword: password,
    allowPrinting: options.allowPrinting,
    allowCopying: options.allowCopying,
    allowModifying: false,
    allowAnnotating: true,
    allowFillingForms: true,
    allowExtraction: options.allowCopying,
    allowAssembly: false,
    allowHighQualityPrint: options.allowPrinting,
  });
}

export async function unlockPdf(
  bytes: Uint8Array,
  openPassword?: string
): Promise<Uint8Array> {
  const cleanPassword = openPassword?.trim();

  if (!cleanPassword) {
    try {
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      for (const page of copied) out.addPage(page);
      return await out.save({ useObjectStreams: true });
    } catch {
      // Encrypted PDF: try ignoreEncryption for owner-only restriction removal
      try {
        const srcIgnored = await PDFDocument.load(bytes, { ignoreEncryption: true });
        if (!srcIgnored.isEncrypted) {
          const out = await PDFDocument.create();
          const copied = await out.copyPages(srcIgnored, srcIgnored.getPageIndices());
          for (const page of copied) out.addPage(page);
          return await out.save({ useObjectStreams: true });
        }
      } catch {
        // Fall through
      }
    }
  }

  // Use pdfjs-dist with password (or empty password for owner-restricted PDFs) and rebuild clean unlocked PDF
  const loadingTask = pdfjsLib.getDocument({
    data: bytes.slice(),
    password: cleanPassword || undefined,
  });
  const pdf = await loadingTask.promise;
  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(renderViewport.width));
    canvas.height = Math.max(1, Math.floor(renderViewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to initialize canvas.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

    const jpgBytes = await canvasToUint8Array(canvas, 'image/jpeg', 0.92);
    const img = await outDoc.embedJpg(jpgBytes);
    const outPage = outDoc.addPage([baseViewport.width, baseViewport.height]);
    outPage.drawImage(img, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });
    page.cleanup();
  }

  await loadingTask.destroy();
  return outDoc.save({ useObjectStreams: true });
}

export async function signPdf(bytes: Uint8Array, options: SignOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = doc.getPageCount();
  if (totalPages === 0) throw new Error('PDF has no pages.');

  let targetIdx = 0;
  if (options.targetPage === 'last') {
    targetIdx = totalPages - 1;
  } else if (options.targetPage === 'number') {
    targetIdx = Math.min(totalPages - 1, Math.max(0, Math.floor(options.pageNumber) - 1));
  }

  const page = doc.getPages()[targetIdx];
  const { width } = page.getSize();
  const margin = 42;

  let sigImageBytes: Uint8Array;
  let drawWidth = 175;
  let drawHeight = 56;

  if (options.mode === 'draw') {
    if (!options.signaturePngBytes || options.signaturePngBytes.byteLength === 0) {
      throw new Error('Please draw your signature first.');
    }
    sigImageBytes = options.signaturePngBytes;
    const embedded = await doc.embedPng(sigImageBytes);
    const dims = embedded.scale(1);
    drawWidth = 180;
    drawHeight = (drawWidth / Math.max(1, dims.width)) * dims.height;

    const x =
      options.placement === 'bottom-left'
        ? margin
        : options.placement === 'bottom-center'
          ? (width - drawWidth) / 2
          : width - drawWidth - margin;

    page.drawImage(embedded, {
      x,
      y: margin,
      width: drawWidth,
      height: drawHeight,
    });
    return doc.save({ useObjectStreams: true });
  }

  const typed = options.typedName.trim();
  if (!typed) {
    throw new Error('Please type your signature.');
  }

  const rendered = await renderTextBlockPng(typed, {
    fontSize: 28,
    colorCss: '#0f172a',
    italic: true,
    maxWidth: 360,
  });
  const embedded = await doc.embedPng(rendered.pngBytes);
  drawWidth = Math.min(220, rendered.width);
  drawHeight = (drawWidth / rendered.width) * rendered.height;

  const x =
    options.placement === 'bottom-left'
      ? margin
      : options.placement === 'bottom-center'
        ? (width - drawWidth) / 2
        : width - drawWidth - margin;

  page.drawImage(embedded, {
    x,
    y: margin,
    width: drawWidth,
    height: drawHeight,
  });

  return doc.save({ useObjectStreams: true });
}

const ADD_TEXT_FONTS: Record<AddTextFont, StandardFonts> = {
  helvetica: StandardFonts.Helvetica,
  courier: StandardFonts.Courier,
  times: StandardFonts.TimesRoman,
};

export async function addTextToPdf(
  bytes: Uint8Array,
  options: AddTextOptions
): Promise<Uint8Array> {
  const rawText = options.text.trim();
  if (!rawText) {
    throw new Error('Please enter text to add.');
  }

  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  if (pages.length === 0) throw new Error('PDF has no pages.');

  const colorMap = {
    black: { pdf: rgb(0.08, 0.09, 0.11), css: '#111827' },
    slate: { pdf: rgb(0.32, 0.39, 0.48), css: '#475569' },
    blue: { pdf: rgb(0.11, 0.36, 0.78), css: '#1d4ed8' },
    red: { pdf: rgb(0.78, 0.16, 0.2), css: '#dc2626' },
  };
  const chosenColor = colorMap[options.color];

  const targetIndices =
    options.targetPage === 'all'
      ? pages.map((_, idx) => idx)
      : options.targetPage === 'first'
        ? [0]
        : [Math.min(pages.length - 1, Math.max(0, Math.floor(options.pageNumber) - 1))];

  const sanitized = sanitizeForWinAnsi(rawText);
  const canUseVector = isWinAnsiEncodable(sanitized);

  if (canUseVector) {
    const font = await doc.embedFont(ADD_TEXT_FONTS[options.font]);
    const lines = sanitized.replace(/\r\n/g, '\n').split('\n');
    const lineHeight = options.fontSize * 1.35;

    for (const idx of targetIndices) {
      const page = pages[idx];
      const { width, height } = page.getSize();
      const longestLineWidth = Math.max(
        ...lines.map((line) => font.widthOfTextAtSize(line || ' ', options.fontSize))
      );

      let startX = 48;
      let startY = height - 64;

      if (options.placement === 'top-left') {
        startX = 48;
        startY = height - 54 - options.fontSize;
      } else if (options.placement === 'top-center') {
        startX = Math.max(24, (width - longestLineWidth) / 2);
        startY = height - 54 - options.fontSize;
      } else if (options.placement === 'center') {
        startX = Math.max(24, (width - longestLineWidth) / 2);
        startY = height / 2 + ((lines.length - 1) * lineHeight) / 2;
      } else if (options.placement === 'bottom-left') {
        startX = 48;
        startY = 48 + (lines.length - 1) * lineHeight;
      } else if (options.placement === 'bottom-center') {
        startX = Math.max(24, (width - longestLineWidth) / 2);
        startY = 48 + (lines.length - 1) * lineHeight;
      } else {
        startX = options.posX;
        startY = options.posY;
      }

      lines.forEach((line, lineIdx) => {
        page.drawText(line, {
          x: startX,
          y: startY - lineIdx * lineHeight,
          size: options.fontSize,
          font,
          color: chosenColor.pdf,
        });
      });
    }
  } else {
    const rendered = await renderTextBlockPng(rawText, {
      fontSize: options.fontSize,
      colorCss: chosenColor.css,
      maxWidth: 500,
    });
    const embedded = await doc.embedPng(rendered.pngBytes);

    for (const idx of targetIndices) {
      const page = pages[idx];
      const { width, height } = page.getSize();
      let x = 48;
      let y = height - 54 - rendered.height;

      if (options.placement === 'top-center') {
        x = Math.max(24, (width - rendered.width) / 2);
        y = height - 54 - rendered.height;
      } else if (options.placement === 'center') {
        x = Math.max(24, (width - rendered.width) / 2);
        y = (height - rendered.height) / 2;
      } else if (options.placement === 'bottom-left') {
        x = 48;
        y = 44;
      } else if (options.placement === 'bottom-center') {
        x = Math.max(24, (width - rendered.width) / 2);
        y = 44;
      } else if (options.placement === 'custom') {
        x = options.posX;
        y = options.posY;
      }

      page.drawImage(embedded, {
        x,
        y,
        width: rendered.width,
        height: rendered.height,
      });
    }
  }

  return doc.save({ useObjectStreams: true });
}

export async function watermarkPdf(
  bytes: Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const rawText = options.text.trim();
  if (!rawText) {
    throw new Error('Watermark text cannot be empty.');
  }

  const text = sanitizeForWinAnsi(rawText);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const colorMap = {
    slate: { pdf: rgb(0.35, 0.42, 0.52), css: 'rgba(89, 107, 133, 0.35)' },
    red: { pdf: rgb(0.82, 0.16, 0.19), css: 'rgba(209, 41, 48, 0.35)' },
    blue: { pdf: rgb(0.14, 0.39, 0.88), css: 'rgba(36, 99, 224, 0.35)' },
    black: { pdf: rgb(0.08, 0.09, 0.11), css: 'rgba(20, 23, 28, 0.35)' },
  };
  const chosenColor = colorMap[options.color];

  if (!isWinAnsiEncodable(text)) {
    const rendered = await renderTextBlockPng(rawText, {
      fontSize: options.fontSize,
      colorCss: chosenColor.css,
    });
    const embedded = await doc.embedPng(rendered.pngBytes);
    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      const y =
        options.position === 'header'
          ? height - 42 - rendered.height
          : options.position === 'footer'
            ? 24
            : (height - rendered.height) / 2;
      page.drawImage(embedded, {
        x: (width - rendered.width) / 2,
        y,
        width: rendered.width,
        height: rendered.height,
        rotate: options.position === 'diagonal' ? degrees(options.angle) : degrees(0),
      });
    }
    return doc.save({ useObjectStreams: true });
  }

  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);

    let x = (width - textWidth) / 2;
    let y = height / 2;
    let angle = options.angle;

    if (options.position === 'header') {
      y = height - 42;
      angle = 0;
    } else if (options.position === 'footer') {
      y = 28;
      angle = 0;
    } else {
      const rad = (angle * Math.PI) / 180;
      x = width / 2 - (textWidth / 2) * Math.cos(rad);
      y = height / 2 - (textWidth / 2) * Math.sin(rad);
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: chosenColor.pdf,
      opacity: options.opacity,
      rotate: degrees(angle),
    });
  }

  return doc.save({ useObjectStreams: true });
}

export async function extractTextFromPdf(
  bytes: Uint8Array
): Promise<{ fullText: string; pages: { page: number; text: string }[] }> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const pages: { page: number; text: string }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    const chunks: string[] = [];

    for (const item of content.items) {
      if ('str' in item) {
        const y = Array.isArray(item.transform) ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
          chunks.push('\n');
        } else if (chunks.length > 0 && !chunks[chunks.length - 1].endsWith('\n')) {
          chunks.push(' ');
        }
        chunks.push(item.str);
        if (y !== null) lastY = y;
      }
    }

    const pageText = chunks.join('').replace(/[ \t]+\n/g, '\n').trim();
    pages.push({ page: i, text: pageText });
    page.cleanup();
  }

  await loadingTask.destroy();
  const fullText = pages.map((p) => `--- Page ${p.page} ---\n${p.text}`).join('\n\n');

  return { fullText, pages };
}

export async function convertDocxToPdf(bytes: Uint8Array, title?: string): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(bytes);
  const docEntry = zip.file('word/document.xml');
  if (!docEntry) {
    throw new Error('Could not read Word (.docx) document structure.');
  }

  const xmlText = await docEntry.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS('*', 'p'));

  const extractedParagraphs: string[] = [];
  for (const p of paragraphs) {
    const runs = Array.from(p.getElementsByTagNameNS('*', 't'));
    const text = runs.map((t) => t.textContent ?? '').join('').trim();
    if (text) {
      extractedParagraphs.push(text);
    } else if (extractedParagraphs.length > 0 && extractedParagraphs[extractedParagraphs.length - 1] !== '') {
      extractedParagraphs.push('');
    }
  }

  const combined = extractedParagraphs.join('\n\n').trim() || '(Empty Word document)';
  return convertTextToPdf(combined, title);
}

export async function buildDocxFromPages(
  title: string,
  pages: { page: number; text: string }[]
): Promise<Blob> {
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const paragraphsXml: string[] = [];
  if (title.trim()) {
    paragraphsXml.push(
      `<w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t xml:space="preserve">${escapeXml(
        title.trim()
      )}</w:t></w:r></w:p>`
    );
  }

  pages.forEach((p, pageIdx) => {
    if (pageIdx > 0) {
      paragraphsXml.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    }
    const lines = p.text ? p.text.split('\n') : [''];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        paragraphsXml.push(`<w:p/>`);
      } else {
        paragraphsXml.push(
          `<w:p><w:r><w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`
        );
      }
    }
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml.join('\n    ')}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.folder('_rels')?.file('.rels', rootRelsXml);
  zip.folder('word')?.file('document.xml', documentXml);

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

export async function convertPdfToDocx(bytes: Uint8Array, title: string): Promise<Blob> {
  const extracted = await extractTextFromPdf(bytes);
  return buildDocxFromPages(title, extracted.pages);
}

export async function createZipFromOutputs(
  outputs: { filename: string; blob: Blob }[]
): Promise<Blob> {
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const out of outputs) {
    let targetName = out.filename;
    const count = usedNames.get(targetName) ?? 0;
    if (count > 0) {
      const dot = targetName.lastIndexOf('.');
      targetName =
        dot > 0
          ? `${targetName.slice(0, dot)}_${count + 1}${targetName.slice(dot)}`
          : `${targetName}_${count + 1}`;
    }
    usedNames.set(out.filename, count + 1);
    zip.file(targetName, out.blob);
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  const runners = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx], idx);
    }
  });

  await Promise.all(runners);
}

export async function cropPdf(bytes: Uint8Array, options: CropOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  if (pages.length === 0) throw new Error('PDF has no pages.');

  const indices = options.targetPage === 'first' ? [0] : pages.map((_, idx) => idx);
  for (const idx of indices) {
    const page = pages[idx];
    const currentBox = page.getCropBox();
    const nextBox = computeCroppedBox(currentBox, {
      topPct: options.topPct,
      rightPct: options.rightPct,
      bottomPct: options.bottomPct,
      leftPct: options.leftPct,
    });
    page.setCropBox(nextBox.x, nextBox.y, nextBox.width, nextBox.height);
    page.setMediaBox(nextBox.x, nextBox.y, nextBox.width, nextBox.height);
  }

  return doc.save({ useObjectStreams: true });
}

export async function readPdfMetadata(
  bytes: Uint8Array
): Promise<{ title: string; author: string; subject: string; keywords: string }> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return {
    title: doc.getTitle() ?? '',
    author: doc.getAuthor() ?? '',
    subject: doc.getSubject() ?? '',
    keywords: doc.getKeywords() ?? '',
  };
}

export async function editPdfMetadata(
  bytes: Uint8Array,
  options: MetadataOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  if (options.mode === 'wipe') {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setCreator('');
    doc.setProducer('');
  } else {
    doc.setTitle(sanitizeForWinAnsi(options.title.trim()));
    doc.setAuthor(sanitizeForWinAnsi(options.author.trim()));
    doc.setSubject(sanitizeForWinAnsi(options.subject.trim()));
    const kwList = options.keywords
      .split(',')
      .map((k) => sanitizeForWinAnsi(k.trim()))
      .filter(Boolean);
    doc.setKeywords(kwList);
    doc.setCreator('LargePDF');
    doc.setProducer('LargePDF');
  }

  return doc.save({ useObjectStreams: true });
}

export async function flattenPdf(
  bytes: Uint8Array,
  options: FlattenOptions,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  if (options.mode === 'forms') {
    onProgress?.(40);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    try {
      const form = doc.getForm();
      form.flatten();
    } catch {
      // PDF has no interactive AcroForm fields; clean re-save still normalizes layers safely
    }
    onProgress?.(100);
    return doc.save({ useObjectStreams: true });
  }

  // Full page lock: rasterizes all layers (text, annotations, forms, stamps) into static pages
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const outDoc = await PDFDocument.create();
  outDoc.setCreator('LargePDF');
  outDoc.setProducer('LargePDF');
  const scale = Math.max(1, options.dpi / 72);

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(renderViewport.width));
    canvas.height = Math.max(1, Math.floor(renderViewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create 2D canvas context.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: renderViewport, canvas }).promise;

    const jpgBytes = await canvasToUint8Array(canvas, 'image/jpeg', 0.92);
    const img = await outDoc.embedJpg(jpgBytes);
    const outPage = outDoc.addPage([baseViewport.width, baseViewport.height]);
    outPage.drawImage(img, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });
    page.cleanup();
    onProgress?.(Math.min(95, Math.round((i / totalPages) * 95)));
  }

  await loadingTask.destroy();
  const out = await outDoc.save({ useObjectStreams: true });
  onProgress?.(100);
  return out;
}

export async function createSampleStampPngBytes(label = 'APPROVED'): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to create stamp canvas.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);

  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 2);

  return canvasToUint8Array(canvas, 'image/png', 1);
}

export async function stampImageOnPdf(
  bytes: Uint8Array,
  options: StampImageOptions
): Promise<Uint8Array> {
  if (!options.imageBytes || options.imageBytes.byteLength === 0) {
    throw new Error('Please choose an image or stamp first.');
  }

  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  if (pages.length === 0) throw new Error('PDF has no pages.');

  const embedded = await embedAnyImageIntoPdf(
    doc,
    options.imageBytes,
    options.imageMimeType || 'image/png'
  );
  const rawDims = embedded.scale(1);
  const ratio = rawDims.height / Math.max(1, rawDims.width);

  const targetIndices =
    options.targetPage === 'all'
      ? pages.map((_, idx) => idx)
      : options.targetPage === 'first'
        ? [0]
        : [Math.min(pages.length - 1, Math.max(0, Math.floor(options.pageNumber) - 1))];

  const margin = 32;
  const pct = Math.min(80, Math.max(5, options.widthPercent)) / 100;

  for (const idx of targetIndices) {
    const page = pages[idx];
    const { width, height } = page.getSize();
    const drawWidth = Math.max(24, width * pct);
    const drawHeight = drawWidth * ratio;

    let x = margin;
    let y = height - margin - drawHeight;

    switch (options.placement) {
      case 'top-left':
        x = margin;
        y = height - margin - drawHeight;
        break;
      case 'top-right':
        x = Math.max(margin, width - margin - drawWidth);
        y = height - margin - drawHeight;
        break;
      case 'center':
        x = (width - drawWidth) / 2;
        y = (height - drawHeight) / 2;
        break;
      case 'bottom-left':
        x = margin;
        y = margin;
        break;
      case 'bottom-right':
        x = Math.max(margin, width - margin - drawWidth);
        y = margin;
        break;
    }

    page.drawImage(embedded, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      opacity: Math.min(1, Math.max(0.1, options.opacity)),
    });
  }

  return doc.save({ useObjectStreams: true });
}
