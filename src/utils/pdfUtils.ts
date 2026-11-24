import type {
  BatchItem,
  BatchSummary,
  CompressionOptions,
  CompressionPreset,
  FileKind,
  PageNumberFormat,
} from '../types/pdf';

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exp);
  if (exp === 0) return `${Math.round(bytes)} B`;
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[exp]}`;
}

export function calculateSavings(
  originalBytes: number,
  outputBytes: number
): { savedBytes: number; percent: number; isSmaller: boolean } {
  if (originalBytes <= 0 || outputBytes < 0) {
    return { savedBytes: 0, percent: 0, isSmaller: false };
  }
  const diff = originalBytes - outputBytes;
  const percent = Math.round((diff / originalBytes) * 100);
  return {
    savedBytes: diff,
    percent,
    isSmaller: diff > 0,
  };
}

export function parsePageRanges(input: string, totalPages: number): number[] {
  if (totalPages < 1) {
    throw new Error('Document has no pages.');
  }
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Enter at least one page or range (e.g. 1-3, 5).');
  }

  const result: number[] = [];
  const seen = new Set<number>();
  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) {
    throw new Error('Enter at least one page or range (e.g. 1-3, 5).');
  }

  for (const part of parts) {
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        throw new Error(`Range "${part}" is outside 1–${totalPages}.`);
      }
      if (start > end) {
        throw new Error(`Range "${part}" has start greater than end.`);
      }
      for (let p = start; p <= end; p++) {
        if (!seen.has(p)) {
          seen.add(p);
          result.push(p);
        }
      }
      continue;
    }

    const singleMatch = /^(\d+)$/.exec(part);
    if (singleMatch) {
      const page = Number(singleMatch[1]);
      if (page < 1 || page > totalPages) {
        throw new Error(`Page "${page}" is outside 1–${totalPages}.`);
      }
      if (!seen.has(page)) {
        seen.add(page);
        result.push(page);
      }
      continue;
    }

    throw new Error(`Invalid page token "${part}". Use numbers or ranges like 1-3, 5.`);
  }

  return result;
}

export function computeDeleteKeepIndices(totalPages: number, deleteRanges: string): number[] {
  const toDelete = new Set(parsePageRanges(deleteRanges, totalPages));
  const kept: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (!toDelete.has(p)) {
      kept.push(p);
    }
  }
  if (kept.length === 0) {
    throw new Error('Cannot delete every page. Keep at least 1 page.');
  }
  return kept;
}

export function reorderArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length ||
    fromIndex === toIndex
  ) {
    return list;
  }
  const copy = [...list];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

export function toRomanNumeral(num: number): string {
  const safe = Math.max(1, Math.floor(num));
  const vals: [number, string][] = [
    [1000, 'm'],
    [900, 'cm'],
    [500, 'd'],
    [400, 'cd'],
    [100, 'c'],
    [90, 'xc'],
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  let rem = safe;
  let out = '';
  for (const [v, sym] of vals) {
    while (rem >= v) {
      out += sym;
      rem -= v;
    }
  }
  return out;
}

export function formatPageNumberText(num: number, format: PageNumberFormat): string {
  switch (format) {
    case 'roman':
      return toRomanNumeral(num);
    case 'dashed':
      return `- ${num} -`;
    case 'numeric':
    default:
      return String(num);
  }
}

export function sanitizeForWinAnsi(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/\u00A0/g, ' ');
}

export function isWinAnsiEncodable(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13) continue;
    if (code >= 32 && code <= 255) continue;
    return false;
  }
  return true;
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildOutputFilename(originalName: string, suffix: string, newExt?: string): string {
  const cleanName = originalName.trim() || 'document.pdf';
  const lastDot = cleanName.lastIndexOf('.');
  const base = lastDot > 0 ? cleanName.slice(0, lastDot) : cleanName;
  const existingExt = lastDot > 0 ? cleanName.slice(lastDot + 1) : 'pdf';
  const ext = (newExt ?? existingExt).replace(/^\./, '');
  const cleanSuffix = suffix ? `_${suffix}` : '';
  return `${base}${cleanSuffix}.${ext}`;
}

export function clampConcurrency(value: number): number {
  if (!Number.isFinite(value)) return 2;
  return Math.min(4, Math.max(1, Math.round(value)));
}

export function detectFileKind(fileName: string, mimeType: string): FileKind {
  const lower = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return 'word';
  }
  if (
    mime.startsWith('image/') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp')
  ) {
    return 'image';
  }
  if (
    mime.startsWith('text/') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.json')
  ) {
    return 'text';
  }
  return 'unsupported';
}

export function getPresetOptions(preset: CompressionPreset, targetSizeMb = 2): CompressionOptions {
  switch (preset) {
    case 'lossless':
      return {
        preset: 'lossless',
        dpi: 300,
        imageQuality: 0.95,
        grayscale: false,
        stripMetadata: true,
        targetSizeMb,
      };
    case 'balanced':
      return {
        preset: 'balanced',
        dpi: 130,
        imageQuality: 0.7,
        grayscale: false,
        stripMetadata: true,
        targetSizeMb,
      };
    case 'maximum':
      return {
        preset: 'maximum',
        dpi: 92,
        imageQuality: 0.45,
        grayscale: false,
        stripMetadata: true,
        targetSizeMb,
      };
    case 'target-size':
      return {
        preset: 'target-size',
        dpi: 150,
        imageQuality: 0.85,
        grayscale: false,
        stripMetadata: true,
        targetSizeMb: Math.max(0.1, targetSizeMb),
      };
    case 'custom':
    default:
      return {
        preset: 'custom',
        dpi: 120,
        imageQuality: 0.65,
        grayscale: false,
        stripMetadata: true,
        targetSizeMb,
      };
  }
}

export function mbToBytes(mb: number): number {
  const safeMb = Number.isFinite(mb) ? Math.max(0.05, mb) : 2;
  return Math.round(safeMb * 1024 * 1024);
}

export interface CompressionTargetStep {
  scaleRatio: number; // relative to base 150 DPI
  quality: number;
}

export function buildTargetCompressionSteps(): CompressionTargetStep[] {
  return [
    { scaleRatio: 1.0, quality: 0.86 },
    { scaleRatio: 0.9, quality: 0.74 },
    { scaleRatio: 0.8, quality: 0.62 },
    { scaleRatio: 0.68, quality: 0.5 },
    { scaleRatio: 0.56, quality: 0.4 },
    { scaleRatio: 0.48, quality: 0.3 },
  ];
}

export function computeCroppedBox(
  box: { x: number; y: number; width: number; height: number },
  margins: { topPct: number; rightPct: number; bottomPct: number; leftPct: number }
): { x: number; y: number; width: number; height: number } {
  const clampPct = (v: number) =>
    Number.isFinite(v) ? Math.min(40, Math.max(0, v)) : 0;

  const leftPct = clampPct(margins.leftPct);
  const rightPct = clampPct(margins.rightPct);
  const topPct = clampPct(margins.topPct);
  const bottomPct = clampPct(margins.bottomPct);

  if (leftPct + rightPct >= 85) {
    throw new Error('Horizontal crop percentages cannot reach 85% or more.');
  }
  if (topPct + bottomPct >= 85) {
    throw new Error('Vertical crop percentages cannot reach 85% or more.');
  }

  const insetLeft = (box.width * leftPct) / 100;
  const insetRight = (box.width * rightPct) / 100;
  const insetBottom = (box.height * bottomPct) / 100;
  const insetTop = (box.height * topPct) / 100;

  const newWidth = box.width - insetLeft - insetRight;
  const newHeight = box.height - insetTop - insetBottom;

  if (newWidth < 36 || newHeight < 36) {
    throw new Error('Cropped page area would be too small.');
  }

  return {
    x: box.x + insetLeft,
    y: box.y + insetBottom,
    width: newWidth,
    height: newHeight,
  };
}

export function summarizeBatch(
  items: Pick<BatchItem, 'status' | 'originalSize' | 'outputSize'>[]
): BatchSummary {
  let queuedCount = 0;
  let processingCount = 0;
  let doneCount = 0;
  let errorCount = 0;
  let totalOriginalBytes = 0;
  let totalOutputBytes = 0;
  let doneOriginalBytes = 0;

  for (const item of items) {
    totalOriginalBytes += item.originalSize;
    if (item.status === 'queued') queuedCount++;
    else if (item.status === 'processing') processingCount++;
    else if (item.status === 'done') {
      doneCount++;
      doneOriginalBytes += item.originalSize;
      totalOutputBytes += item.outputSize ?? item.originalSize;
    } else if (item.status === 'error') errorCount++;
  }

  const savedBytes = doneOriginalBytes > 0 ? doneOriginalBytes - totalOutputBytes : 0;
  const savedPercent =
    doneOriginalBytes > 0 ? Math.round((savedBytes / doneOriginalBytes) * 100) : 0;

  return {
    totalFiles: items.length,
    queuedCount,
    processingCount,
    doneCount,
    errorCount,
    totalOriginalBytes,
    totalOutputBytes,
    savedBytes,
    savedPercent,
  };
}
