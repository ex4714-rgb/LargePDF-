export type ToolId =
  | 'compress'
  | 'merge'
  | 'split'
  | 'pdf-to-images'
  | 'images-to-pdf'
  | 'word-to-pdf'
  | 'pdf-to-word'
  | 'extract'
  | 'rotate'
  | 'delete-pages'
  | 'reorder'
  | 'crop'
  | 'page-numbers'
  | 'watermark'
  | 'add-text'
  | 'stamp-image'
  | 'sign'
  | 'flatten'
  | 'metadata'
  | 'protect'
  | 'unlock';

export type CompressionPreset = 'lossless' | 'balanced' | 'maximum' | 'target-size' | 'custom';

export interface CompressionOptions {
  preset: CompressionPreset;
  dpi: number;
  imageQuality: number; // 0.25 to 0.95
  grayscale: boolean;
  stripMetadata: boolean;
  targetSizeMb: number;
}

export type ImageOutputFormat = 'png' | 'jpeg' | 'webp';

export interface PdfToImagesOptions {
  format: ImageOutputFormat;
  dpi: number;
  quality: number;
}

export interface ImagesToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
}

export interface SplitOptions {
  mode: 'all' | 'ranges';
  ranges: string;
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  angle: number;
  color: 'slate' | 'red' | 'blue' | 'black';
  position: 'diagonal' | 'footer' | 'header';
}

export type PageNumberPosition =
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'top-left'
  | 'top-center'
  | 'top-right';

export type PageNumberFormat = 'numeric' | 'roman' | 'dashed';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  startNumber: number;
  fontSize: number;
}

export interface ProtectOptions {
  userPassword: string;
  allowPrinting: boolean;
  allowCopying: boolean;
}

export interface UnlockOptions {
  openPassword: string;
}

export interface DeletePagesOptions {
  ranges: string;
}

export type SignMode = 'draw' | 'type';
export type SignPlacement = 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface SignOptions {
  mode: SignMode;
  typedName: string;
  signaturePngBytes: Uint8Array | null;
  targetPage: 'first' | 'last' | 'number';
  pageNumber: number;
  placement: SignPlacement;
}

export type AddTextFont = 'helvetica' | 'courier' | 'times';
export type AddTextPlacement =
  | 'top-left'
  | 'top-center'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'custom';

export interface AddTextOptions {
  text: string;
  targetPage: 'first' | 'all' | 'number';
  pageNumber: number;
  font: AddTextFont;
  fontSize: number;
  color: 'black' | 'slate' | 'blue' | 'red';
  placement: AddTextPlacement;
  posX: number;
  posY: number;
}

export type ExtractFormat = 'txt' | 'md' | 'json';

export interface CropOptions {
  preset: 'light' | 'medium' | 'header-footer' | 'custom';
  topPct: number;
  rightPct: number;
  bottomPct: number;
  leftPct: number;
  targetPage: 'all' | 'first';
}

export interface MetadataOptions {
  mode: 'edit' | 'wipe';
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

export interface FlattenOptions {
  mode: 'forms' | 'full';
  dpi: number;
}

export type StampImagePlacement =
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-right';

export interface StampImageOptions {
  imageBytes: Uint8Array | null;
  imageMimeType: string;
  imageName: string;
  targetPage: 'first' | 'all' | 'number';
  pageNumber: number;
  placement: StampImagePlacement;
  widthPercent: number;
  opacity: number;
}

export type FileKind = 'pdf' | 'image' | 'word' | 'text' | 'unsupported';

export type BatchStatus = 'queued' | 'processing' | 'done' | 'error';

export interface OutputArtifact {
  filename: string;
  blob: Blob;
  size: number;
  mimeType: string;
  previewText?: string;
}

export interface PageEditState {
  pageNumber: number; // 1-indexed original page
  rotation: number; // 0, 90, 180, 270
  deleted: boolean;
  thumbnailUrl?: string;
}

export interface BatchItem {
  id: string;
  name: string;
  mimeType: string;
  kind: FileKind;
  originalSize: number;
  bytes: Uint8Array;
  pageCount?: number;
  status: BatchStatus;
  progress: number; // 0..100
  error?: string;
  outputs: OutputArtifact[];
  outputSize?: number;
  durationMs?: number;
  pageEdits?: PageEditState[];
}

export interface BatchSummary {
  totalFiles: number;
  queuedCount: number;
  processingCount: number;
  doneCount: number;
  errorCount: number;
  totalOriginalBytes: number;
  totalOutputBytes: number;
  savedBytes: number;
  savedPercent: number;
}
