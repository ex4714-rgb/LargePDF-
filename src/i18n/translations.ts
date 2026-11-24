import type { ToolId } from '../types/pdf';

export type SupportedLanguage = 'en' | 'fr' | 'ar' | 'es' | 'pt';

export type LanguagePreference = 'auto' | SupportedLanguage;

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  'en',
  'fr',
  'ar',
  'es',
  'pt',
] as const;

export const LANGUAGE_NATIVE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  es: 'Español',
  pt: 'Português',
};

export function isRtlLanguage(lang: SupportedLanguage): boolean {
  return lang === 'ar';
}

export function normalizeLanguageTag(tag: string | undefined | null): SupportedLanguage | null {
  if (!tag) return null;
  const clean = tag.trim().toLowerCase().replace(/_/g, '-');
  if (!clean) return null;
  const primary = clean.split('-')[0];
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(primary)) {
    return primary as SupportedLanguage;
  }
  return null;
}

export function detectDeviceLanguage(
  navigatorLanguages?: readonly string[] | null,
  navigatorLanguage?: string | null,
  urlSearch?: string | null
): SupportedLanguage {
  if (urlSearch) {
    try {
      const params = new URLSearchParams(urlSearch);
      const langParam = params.get('lang');
      if (langParam && langParam.trim() !== '') {
        return normalizeLanguageTag(langParam) ?? 'en';
      }
    } catch {
      // Ignore malformed query strings
    }
  }

  const primaryFromList = navigatorLanguages?.find((tag) => tag && tag.trim().length > 0);
  const primary = primaryFromList || navigatorLanguage;
  return normalizeLanguageTag(primary) ?? 'en';
}

export interface TranslationDict {
  navShrink: string;
  navMerge: string;
  navSplit: string;
  navSign: string;
  navProtect: string;
  navAllTools: string;
  allToolsSectionTitle: string;
  allToolsSectionSubtitle: string;
  chooseFiles: string;
  step1PickTask: string;
  step2PickFiles: string;
  addMoreFiles: string;
  dropHelper: string;
  trySampleFiles: string;
  creatingSamples: string;
  privateOnDevice: string;
  brandBy: string;
  localProcessingBtnAria: string;
  localProcessingTitle: string;
  localProcessingExplain: string;
  noFileLimits: string;
  sidebarPrivacy: string;
  lightMode: string;
  darkMode: string;
  lightShort: string;
  darkShort: string;
  languageAutoLabel: string;
  languageLabel: string;
  batchSpeedLabel: (n: number) => string;
  groups: {
    basics: string;
    convert: string;
    edit: string;
    security: string;
  };
  tools: Record<ToolId, { label: string; shortDesc: string; actionHint: string }>;
  compressQuestion: string;
  compressSubtitle: string;
  advancedSettings: string;
  hideAdvanced: string;
  presetGentleTitle: string;
  presetGentleDesc: string;
  presetRecommendedTitle: string;
  presetRecommendedDesc: string;
  presetSmallestTitle: string;
  presetSmallestDesc: string;
  presetTargetTitle: string;
  presetTargetDesc: string;
  targetSizeLimitLabel: string;
  targetSizeCustomMb: string;
  targetResolution: string;
  imageQuality: string;
  blackAndWhite: string;
  stripExtraInfo: string;
  pdfToImgFormatLabel: string;
  pdfToImgClarityLabel: string;
  imgToPdfSizeLabel: string;
  imgToPdfHint: string;
  wordToPdfHint: string;
  pdfToWordHint: string;
  paperSize: string;
  paperA4: string;
  paperLetter: string;
  paperFit: string;
  photoClarity: string;
  clarityStandard: string;
  clarityClear: string;
  claritySharp: string;
  mergeFilenameLabel: string;
  mergeOrderHint: string;
  splitQuestion: string;
  splitAllPages: string;
  splitPickNumbers: string;
  splitPagesLabel: string;
  rotateTitle: string;
  rotateHint: string;
  turnLeft: string;
  turnRight: string;
  deletePagesLabel: string;
  deletePagesHint: string;
  reorderTitle: string;
  reorderHint: string;
  reorderOpenFirst: string;
  pageNumbersPosLabel: string;
  pageNumbersFormatLabel: string;
  pageNumbersStartLabel: string;
  pageNumbersSizeLabel: string;
  posBottomLeft: string;
  posBottomCenter: string;
  posBottomRight: string;
  posTopLeft: string;
  posTopCenter: string;
  posTopRight: string;
  watermarkLabel: string;
  watermarkPlaceLabel: string;
  watermarkColorLabel: string;
  watermarkDiagonal: string;
  watermarkHeader: string;
  watermarkFooter: string;
  colorSlate: string;
  colorRed: string;
  colorBlue: string;
  colorBlack: string;
  addTextInputLabel: string;
  addTextPlaceholder: string;
  addTextPageLabel: string;
  addTextPageFirst: string;
  addTextPageAll: string;
  addTextPageNumber: string;
  addTextFontLabel: string;
  addTextPlaceLabel: string;
  addTextSizeLabel: string;
  placeTopLeft: string;
  placeTopCenter: string;
  placeCenter: string;
  placeBottomLeft: string;
  placeBottomCenter: string;
  signModeDraw: string;
  signModeType: string;
  signDrawPrompt: string;
  signClearPad: string;
  signTypePrompt: string;
  signTypePlaceholder: string;
  signPageLabel: string;
  signPageLast: string;
  signCornerLabel: string;
  protectPasswordLabel: string;
  protectPasswordPlaceholder: string;
  protectAllowPrint: string;
  protectAllowCopy: string;
  unlockHint: string;
  unlockPasswordLabel: string;
  unlockPasswordPlaceholder: string;
  extractTitle: string;
  extractHint: string;
  extractTxt: string;
  extractMd: string;
  extractJson: string;
  notesHeader: string;
  addNotesBtn: string;
  noteTitlePlaceholder: string;
  noteBodyPlaceholder: string;
  filterAll: (n: number) => string;
  filterReady: (n: number) => string;
  filterDone: (n: number) => string;
  filterSkipped: (n: number) => string;
  findFilePlaceholder: string;
  removeDone: string;
  clearList: string;
  colFileName: string;
  colBefore: string;
  colAfter: string;
  colStatus: string;
  colActions: string;
  statusReady: string;
  statusDone: string;
  statusWorking: (p: number) => string;
  statusSmaller: (p: number) => string;
  btnView: string;
  btnSave: string;
  btnSaveFile: string;
  downloadAllZip: string;
  workingOnFiles: string;
  actionRunLabel: (tool: ToolId, count: number) => string;
  totalFilesLabel: (count: number) => string;
  totalBefore: string;
  totalNow: string;
  totalSaved: (bytes: string, percent: number) => string;
  guide1Title: string;
  guide1Desc: string;
  guide2Title: string;
  guide2Desc: string;
  guide3Title: string;
  guide3Desc: string;
  inspectorBefore: string;
  inspectorAfter: string;
  inspectorClose: string;
  inspectorWordsFound: string;
  inspectorCopyAll: string;
  inspectorCopied: string;
  inspectorPagesTitle: string;
  inspectorSavePages: string;
  inspectorPageNum: (n: number) => string;
  inspectorMoveUp: string;
  inspectorMoveDown: string;
  compareTabCompare: string;
  compareTabPages: string;
  compareSliderLabel: string;
  compareOriginal: string;
  compareProcessed: string;
  compareLoading: string;
  sendToNextTool: string;
  sendResultsToNext: string;
  chainGo: string;
  chainedNotice: (count: number, toolLabel: string) => string;
  cropPresetLight: string;
  cropPresetMedium: string;
  cropPresetHeaders: string;
  cropTopLabel: string;
  cropRightLabel: string;
  cropBottomLabel: string;
  cropLeftLabel: string;
  cropPagesLabel: string;
  metadataModeEdit: string;
  metadataModeWipe: string;
  metadataLoadCurrent: string;
  metadataTitleLabel: string;
  metadataAuthorLabel: string;
  metadataSubjectLabel: string;
  metadataKeywordsLabel: string;
  metadataWipeHint: string;
  flattenModeForms: string;
  flattenModeFull: string;
  flattenFormsHint: string;
  flattenFullHint: string;
  stampImgPickLabel: string;
  stampImgTrySample: string;
  stampImgSelected: (name: string) => string;
  stampImgSizeLabel: string;
  stampImgOpacityLabel: string;
  footerNote: string;
  closeNotice: string;
}

const en: TranslationDict = {
  navShrink: 'Compress PDF',
  navMerge: 'Merge PDF',
  navSplit: 'Split PDF',
  navSign: 'Sign PDF',
  navProtect: 'Protect PDF',
  navAllTools: 'All 21 Tools',
  allToolsSectionTitle: 'All 21 PDF & Document Tools',
  allToolsSectionSubtitle: 'Click any tool below to start right away.',
  chooseFiles: 'Choose Files',
  step1PickTask: 'Step 1 · Pick a Tool',
  step2PickFiles: 'Step 2 · Pick the files you want to work on',
  addMoreFiles: 'Add more files to this list',
  dropHelper: 'Drag files into this box, or click Choose Files below (PDF, photos, Word, or text).',
  trySampleFiles: 'Try with Sample Files',
  creatingSamples: 'Creating samples...',
  privateOnDevice: 'Private on your device',
  brandBy: 'by xCC',
  localProcessingBtnAria: 'Learn what Private on your device means',
  localProcessingTitle: 'What does "Private on your device" mean?',
  localProcessingExplain: 'Everything runs directly inside your browser on this computer or phone. Your files are never uploaded to the internet or sent to any server—your private documents stay only with you.',
  noFileLimits: 'No file limits',
  sidebarPrivacy: '100% private: your files stay on your device and are never uploaded.',
  lightMode: 'Switch to Light Mode',
  darkMode: 'Switch to Dark Mode',
  lightShort: 'Light',
  darkShort: 'Dark',
  languageAutoLabel: 'Auto (Device)',
  languageLabel: 'Language',
  batchSpeedLabel: (n) => `Batch Speed (${n} ${n === 1 ? 'file' : 'files'} at once)`,
  groups: {
    basics: 'Everyday Tools',
    convert: 'Convert & Extract',
    edit: 'Edit, Mark & Sign',
    security: 'Password & Lock',
  },
  tools: {
    compress: {
      label: 'Compress PDF',
      shortDesc: 'Make large PDFs & photos smaller',
      actionHint: 'Great for email attachments or saving storage space.',
    },
    merge: {
      label: 'Merge PDF',
      shortDesc: 'Combine multiple PDFs & photos into 1',
      actionHint: 'Put several PDFs and photos together in the order you choose.',
    },
    split: {
      label: 'Split PDF',
      shortDesc: 'Pull out the pages you need',
      actionHint: 'Save every page on its own or pick specific page numbers.',
    },
    'pdf-to-images': {
      label: 'PDF to Images',
      shortDesc: 'Turn PDF pages into PNG, JPG, or WebP',
      actionHint: 'Save every page of your PDF as clear picture files.',
    },
    'images-to-pdf': {
      label: 'Images to PDF',
      shortDesc: 'Turn JPG, PNG, or WebP photos into PDF',
      actionHint: 'Convert photos and scanned pictures into clean PDF documents.',
    },
    'word-to-pdf': {
      label: 'Word to PDF',
      shortDesc: 'Turn Word (.docx) or notes into PDF',
      actionHint: 'Convert Microsoft Word documents or typed notes into PDFs.',
    },
    'pdf-to-word': {
      label: 'PDF to Word',
      shortDesc: 'Turn PDF files into editable Word (.docx)',
      actionHint: 'Convert your PDFs into Word documents you can open and edit.',
    },
    extract: {
      label: 'Extract Text',
      shortDesc: 'Get readable words from a PDF',
      actionHint: 'Save all text from your PDFs into plain text, Markdown, or JSON.',
    },
    rotate: {
      label: 'Rotate PDF',
      shortDesc: 'Fix sideways or upside-down pages',
      actionHint: 'Turn crooked scans 90° left or right, or fix individual pages.',
    },
    'delete-pages': {
      label: 'Delete Pages',
      shortDesc: 'Remove unwanted pages from a PDF',
      actionHint: 'Type page numbers to remove, or click View to tap pages off.',
    },
    reorder: {
      label: 'Reorder Pages',
      shortDesc: 'Change the order of pages in a PDF',
      actionHint: 'Open a PDF and move pages up or down until the order is right.',
    },
    'page-numbers': {
      label: 'Page Numbers',
      shortDesc: 'Add page numbers to every page',
      actionHint: 'Place clean numbers at the top or bottom of every PDF page.',
    },
    watermark: {
      label: 'Watermark PDF',
      shortDesc: 'Stamp words like CONFIDENTIAL',
      actionHint: 'Add a clear label across every page of your PDFs.',
    },
    'add-text': {
      label: 'Add Text to PDF',
      shortDesc: 'Write new words onto any PDF page',
      actionHint: 'Insert names, dates, or notes onto one page or every page.',
    },
    sign: {
      label: 'Sign PDF',
      shortDesc: 'Draw or type your signature on a PDF',
      actionHint: 'Draw with your mouse/finger or type your name to sign PDFs.',
    },
    protect: {
      label: 'Protect PDF',
      shortDesc: 'Lock PDFs with a password',
      actionHint: 'Encrypt your PDFs locally with a password before sharing.',
    },
    unlock: {
      label: 'Unlock PDF',
      shortDesc: 'Remove printing or copy restrictions',
      actionHint: 'Strip restrictions from PDFs so you can print and copy freely.',
    },
    crop: {
      label: 'Crop Pages',
      shortDesc: 'Trim wide margins or extra white edges',
      actionHint: 'Cut blank margins, headers, or footers cleanly on your PDF pages.',
    },
    metadata: {
      label: 'Edit PDF Info',
      shortDesc: 'Edit or clear Title, Author & hidden details',
      actionHint: 'Change the saved Title and Author, or clear all hidden details before sharing.',
    },
    flatten: {
      label: 'Lock PDF Edits',
      shortDesc: 'Lock forms, signatures & stamps so nothing can be edited',
      actionHint: 'Locks filled forms, stamps, and signatures so nobody can move or edit them.',
    },
    'stamp-image': {
      label: 'Stamp Logo / Image',
      shortDesc: 'Place an image seal or logo onto PDF pages',
      actionHint: 'Stamp a company logo, approval badge, or picture onto your PDF.',
    },
  },
  compressQuestion: 'How much should we shrink your files?',
  compressSubtitle: 'Pick one option below. Recommended works best for almost every file.',
  advancedSettings: 'Advanced Settings',
  hideAdvanced: 'Hide Advanced',
  presetGentleTitle: 'Gentle (Keep Sharpness)',
  presetGentleDesc: 'Best for crisp text documents',
  presetRecommendedTitle: 'Recommended',
  presetRecommendedDesc: 'Great quality, much smaller size',
  presetSmallestTitle: 'Smallest Size',
  presetSmallestDesc: 'Best for email attachments',
  presetTargetTitle: 'Fit Size Limit',
  presetTargetDesc: 'Aim under 1 MB, 2 MB, 5 MB…',
  targetSizeLimitLabel: 'Keep each file under:',
  targetSizeCustomMb: 'Custom (MB)',
  targetResolution: 'Target Resolution',
  imageQuality: 'Image Quality',
  blackAndWhite: 'Black & white pages',
  stripExtraInfo: 'Remove extra file info',
  pdfToImgFormatLabel: 'Picture format',
  pdfToImgClarityLabel: 'Picture clarity',
  imgToPdfSizeLabel: 'Paper Size',
  imgToPdfHint: 'Each photo becomes its own clean PDF page.',
  wordToPdfHint: 'Choose .docx Word files or .txt notes — or type notes right below.',
  pdfToWordHint: 'Creates an editable Word (.docx) document from each PDF in your list.',
  paperSize: 'Paper Size',
  paperA4: 'Standard A4 Page',
  paperLetter: 'US Letter Page',
  paperFit: 'Match Photo Size',
  photoClarity: 'Photo Clarity',
  clarityStandard: 'Standard (Smaller file)',
  clarityClear: 'Clear (Recommended)',
  claritySharp: 'Extra Sharp (For printing)',
  mergeFilenameLabel: 'Name for your combined PDF',
  mergeOrderHint: 'Use the Up and Down arrows in the file list below to change the order.',
  splitQuestion: 'Which pages do you want?',
  splitAllPages: 'Save Every Page Separately',
  splitPickNumbers: 'Pick Page Numbers',
  splitPagesLabel: 'Page numbers (example: 1-2, 4)',
  rotateTitle: 'Turn Crooked Pages',
  rotateHint: 'Turn all pages at once here, or click View on any file to fix individual pages.',
  turnLeft: 'Turn Left 90°',
  turnRight: 'Turn Right 90°',
  deletePagesLabel: 'Pages to remove (example: 2 or 2-3)',
  deletePagesHint: 'Or click View on any PDF below to visually tap pages you want to remove.',
  reorderTitle: 'Arrange Page Order',
  reorderHint: 'Click View on any PDF in your list below, move pages Up or Down, then save.',
  reorderOpenFirst: 'Open Page Arranger',
  pageNumbersPosLabel: 'Where to put page numbers',
  pageNumbersFormatLabel: 'Number style',
  pageNumbersStartLabel: 'Start at',
  pageNumbersSizeLabel: 'Size',
  posBottomLeft: 'Bottom Left',
  posBottomCenter: 'Bottom Center',
  posBottomRight: 'Bottom Right',
  posTopLeft: 'Top Left',
  posTopCenter: 'Top Center',
  posTopRight: 'Top Right',
  watermarkLabel: 'Words to stamp on each page',
  watermarkPlaceLabel: 'Where to place it',
  watermarkColorLabel: 'Text Color',
  watermarkDiagonal: 'Across the middle',
  watermarkHeader: 'Top of page',
  watermarkFooter: 'Bottom of page',
  colorSlate: 'Soft Gray',
  colorRed: 'Red',
  colorBlue: 'Blue',
  colorBlack: 'Dark Black',
  addTextInputLabel: 'Text to write onto the PDF',
  addTextPlaceholder: 'Type your text, date, or note here...',
  addTextPageLabel: 'Which page',
  addTextPageFirst: 'First page',
  addTextPageAll: 'Every page',
  addTextPageNumber: 'Specific page #',
  addTextFontLabel: 'Font style',
  addTextPlaceLabel: 'Where to place text',
  addTextSizeLabel: 'Text size',
  placeTopLeft: 'Top Left',
  placeTopCenter: 'Top Center',
  placeCenter: 'Center of Page',
  placeBottomLeft: 'Bottom Left',
  placeBottomCenter: 'Bottom Center',
  signModeDraw: 'Draw Signature',
  signModeType: 'Type Name',
  signDrawPrompt: 'Draw your signature inside the box below:',
  signClearPad: 'Clear Pad',
  signTypePrompt: 'Type your full name',
  signTypePlaceholder: 'e.g. Jane Doe',
  signPageLabel: 'Place on page',
  signPageLast: 'Last page',
  signCornerLabel: 'Corner position',
  protectPasswordLabel: 'Password required to open PDF',
  protectPasswordPlaceholder: 'Enter a strong password...',
  protectAllowPrint: 'Allow printing',
  protectAllowCopy: 'Allow copying text',
  unlockHint: 'Removes print and copy locks automatically. Enter password only if the file asks for one to open.',
  unlockPasswordLabel: 'Open password (only if locked)',
  unlockPasswordPlaceholder: 'Leave blank if PDF opens normally',
  extractTitle: 'Save words as a text file',
  extractHint: 'Plain Text (.txt) opens easily in Notepad, TextEdit, or Word.',
  extractTxt: 'Plain Text (.txt)',
  extractMd: 'Markdown (.md)',
  extractJson: 'JSON',
  notesHeader: 'Type or paste your notes to turn into PDF',
  addNotesBtn: 'Add Notes to List',
  noteTitlePlaceholder: 'Title for your PDF',
  noteBodyPlaceholder: 'Write or paste your text here...',
  filterAll: (n) => `All (${n})`,
  filterReady: (n) => `Ready (${n})`,
  filterDone: (n) => `Done (${n})`,
  filterSkipped: (n) => `Skipped (${n})`,
  findFilePlaceholder: 'Find file...',
  removeDone: 'Remove Done',
  clearList: 'Clear List',
  colFileName: 'File Name',
  colBefore: 'Before',
  colAfter: 'After',
  colStatus: 'Status',
  colActions: 'Actions',
  statusReady: 'Ready',
  statusDone: 'Done',
  statusWorking: (p) => `Working ${p}%`,
  statusSmaller: (p) => `${p}% smaller`,
  btnView: 'View',
  btnSave: 'Save',
  btnSaveFile: 'Save File',
  downloadAllZip: 'Download All (ZIP)',
  workingOnFiles: 'Working on your files...',
  actionRunLabel: (tool, count) => {
    const noun = count === 1 ? 'File' : 'Files';
    switch (tool) {
      case 'compress':
        return `Shrink ${count} ${noun}`;
      case 'merge':
        return `Combine ${count} ${noun} into 1 PDF`;
      case 'split':
        return `Split ${count} ${noun}`;
      case 'pdf-to-images':
        return `Convert ${count} ${noun} to Photos`;
      case 'images-to-pdf':
        return `Turn ${count} ${noun} into PDF`;
      case 'word-to-pdf':
        return `Convert ${count} ${noun} to PDF`;
      case 'pdf-to-word':
        return `Convert ${count} ${noun} to Word`;
      case 'extract':
        return `Get Text from ${count} ${noun}`;
      case 'rotate':
        return `Save Rotated PDFs (${count})`;
      case 'delete-pages':
        return `Delete Pages in ${count} ${noun}`;
      case 'reorder':
        return `Save Reordered PDFs (${count})`;
      case 'page-numbers':
        return `Number ${count} ${noun}`;
      case 'watermark':
        return `Watermark ${count} ${noun}`;
      case 'add-text':
        return `Add Text to ${count} ${noun}`;
      case 'sign':
        return `Sign ${count} ${noun}`;
      case 'protect':
        return `Protect ${count} ${noun}`;
      case 'unlock':
        return `Unlock ${count} ${noun}`;
      case 'crop':
        return `Crop ${count} ${noun}`;
      case 'metadata':
        return `Update Info (${count})`;
      case 'flatten':
        return `Lock Edits (${count})`;
      case 'stamp-image':
        return `Stamp Image (${count})`;
    }
  },
  totalFilesLabel: (n) => `${n} ${n === 1 ? 'file' : 'files'}`,
  totalBefore: 'Total',
  totalNow: 'Now',
  totalSaved: (bytes, percent) => `Saved ${bytes} (${percent}%)`,
  guide1Title: 'Easy File Shrinking',
  guide1Desc: 'Pick Recommended to make large PDFs and photos much smaller for email while keeping everything easy to read.',
  guide2Title: 'Do Many Files Together',
  guide2Desc: 'Select multiple files at once instead of doing them one by one, then download everything together in one ZIP folder.',
  guide3Title: 'What Does "Private on Your Device" Mean?',
  guide3Desc: 'Nothing is sent over the internet or saved on a server. Everything runs right inside your browser, so your bank statements, letters, and photos never leave your device.',
  inspectorBefore: 'Before',
  inspectorAfter: 'After',
  inspectorClose: 'Close preview',
  inspectorWordsFound: 'Words Found in Document',
  inspectorCopyAll: 'Copy All Text',
  inspectorCopied: 'Copied',
  inspectorPagesTitle: 'Pages Inside This PDF (Turn, Reorder, or Remove)',
  inspectorSavePages: 'Save Changed Pages as PDF',
  inspectorPageNum: (n) => `Page ${n}`,
  inspectorMoveUp: 'Move earlier',
  inspectorMoveDown: 'Move later',
  compareTabCompare: 'Before / After Compare',
  compareTabPages: 'All Pages',
  compareSliderLabel: 'Drag slider to compare Before vs After sharpness',
  compareOriginal: 'Before (Original)',
  compareProcessed: 'After (Processed)',
  compareLoading: 'Rendering sharp comparison...',
  sendToNextTool: 'Next Tool',
  sendResultsToNext: 'Send finished files to next tool:',
  chainGo: 'Use in Tool →',
  chainedNotice: (count, toolLabel) =>
    `Sent ${count} finished ${count === 1 ? 'file' : 'files'} straight into ${toolLabel}. Ready to run!`,
  cropPresetLight: 'Light Trim (5%)',
  cropPresetMedium: 'Medium Trim (10%)',
  cropPresetHeaders: 'Headers & Footers (12% Top/Bottom)',
  cropTopLabel: 'Top (%)',
  cropRightLabel: 'Right (%)',
  cropBottomLabel: 'Bottom (%)',
  cropLeftLabel: 'Left (%)',
  cropPagesLabel: 'Apply crop to',
  metadataModeEdit: 'Edit Document Info',
  metadataModeWipe: 'Privacy Wipe (Clear All)',
  metadataLoadCurrent: 'Read Info from First PDF',
  metadataTitleLabel: 'Document Title',
  metadataAuthorLabel: 'Author',
  metadataSubjectLabel: 'Subject',
  metadataKeywordsLabel: 'Keywords (comma-separated)',
  metadataWipeHint: 'Clears Title, Author, Subject, Keywords, Creator, and Producer tags completely.',
  flattenModeForms: 'Lock Forms & Annotations',
  flattenModeFull: 'Full Page Lock (Uneditable PDF)',
  flattenFormsHint: 'Locks interactive form fields while keeping text crisp and selectable.',
  flattenFullHint: 'Locks every page completely so stamps, text, and signatures cannot be moved or edited.',
  stampImgPickLabel: 'Choose Logo or Stamp (PNG, JPG, WebP)',
  stampImgTrySample: 'Use Sample APPROVED Stamp',
  stampImgSelected: (name) => `Selected: ${name}`,
  stampImgSizeLabel: 'Stamp Width (% of page)',
  stampImgOpacityLabel: 'Opacity',
  footerNote: 'LargePDF by xCC · Built for fast, private on-device PDF work',
  closeNotice: 'Close',
};

const fr: TranslationDict = {
  navShrink: 'Compresser',
  navMerge: 'Fusionner',
  navSplit: 'Diviser',
  navSign: 'Signer',
  navProtect: 'Protéger',
  navAllTools: 'Les 21 outils',
  allToolsSectionTitle: 'Les 21 outils PDF et documents',
  allToolsSectionSubtitle: 'Choisissez un outil ci-dessous pour commencer tout de suite.',
  chooseFiles: 'Choisir des fichiers',
  step1PickTask: 'Étape 1 · Choisir un outil',
  step2PickFiles: 'Étape 2 · Choisir vos fichiers',
  addMoreFiles: 'Ajouter d’autres fichiers',
  dropHelper: 'Glissez-déposez vos fichiers ici, ou cliquez sur « Choisir des fichiers » (PDF, photos, Word ou texte).',
  trySampleFiles: 'Essayer avec des exemples',
  creatingSamples: 'Préparation des exemples…',
  privateOnDevice: 'Traitement 100 % local',
  brandBy: 'by xCC',
  localProcessingBtnAria: 'Comprendre ce que signifie Traitement 100 % local',
  localProcessingTitle: 'Que veut dire « Traitement 100 % local » ?',
  localProcessingExplain: 'Tout le travail se fait directement sur votre ordinateur ou téléphone, dans votre navigateur. Vos fichiers ne passent par aucun serveur et ne sont jamais envoyés sur Internet : vos documents privés restent uniquement chez vous.',
  noFileLimits: 'Sans limite de taille',
  sidebarPrivacy: '100 % confidentiel : tout se fait sur votre appareil, rien n’est envoyé sur Internet.',
  lightMode: 'Passer en mode clair',
  darkMode: 'Passer en mode sombre',
  lightShort: 'Clair',
  darkShort: 'Sombre',
  languageAutoLabel: 'Auto (Appareil)',
  languageLabel: 'Langue',
  batchSpeedLabel: (n) => `Rapidité (${n} ${n === 1 ? 'fichier' : 'fichiers'} à la fois)`,
  groups: {
    basics: 'Outils essentiels',
    convert: 'Convertir et extraire',
    edit: 'Modifier et signer',
    security: 'Sécurité et confidentialité',
  },
  tools: {
    compress: {
      label: 'Compresser PDF',
      shortDesc: 'Alléger vos PDF et vos photos',
      actionHint: 'Idéal pour envoyer un document par e-mail ou libérer de la place.',
    },
    merge: {
      label: 'Fusionner PDF',
      shortDesc: 'Réunir plusieurs PDF et photos en un seul',
      actionHint: 'Assemblez plusieurs PDF et photos dans l’ordre que vous voulez.',
    },
    split: {
      label: 'Diviser PDF',
      shortDesc: 'Garder uniquement les pages utiles',
      actionHint: 'Enregistrez chaque page séparément ou choisissez seulement certaines pages.',
    },
    'pdf-to-images': {
      label: 'PDF en images',
      shortDesc: 'Transformer chaque page en image (PNG, JPG, WebP)',
      actionHint: 'Enregistrez chaque page de votre PDF sous forme d’image bien nette.',
    },
    'images-to-pdf': {
      label: 'Images en PDF',
      shortDesc: 'Mettre vos photos JPG, PNG ou WebP en PDF',
      actionHint: 'Rassemblez vos photos et documents scannés dans un PDF propre.',
    },
    'word-to-pdf': {
      label: 'Word en PDF',
      shortDesc: 'Convertir un document Word (.docx) ou du texte en PDF',
      actionHint: 'Transformez vos fichiers Word ou notes écrites en documents PDF.',
    },
    'pdf-to-word': {
      label: 'PDF en Word',
      shortDesc: 'Convertir un PDF en fichier Word modifiable (.docx)',
      actionHint: 'Transformez vos PDF en documents Word faciles à modifier.',
    },
    extract: {
      label: 'Extraire le texte',
      shortDesc: 'Récupérer tout le texte écrit dans un PDF',
      actionHint: 'Copiez ou enregistrez tout le texte d’un PDF dans un fichier texte simple.',
    },
    rotate: {
      label: 'Pivoter PDF',
      shortDesc: 'Remettre à l’endroit des pages de travers',
      actionHint: 'Tournez vos pages scannées de 90° à gauche ou à droite, toutes ensemble ou une par une.',
    },
    'delete-pages': {
      label: 'Supprimer des pages',
      shortDesc: 'Retirer les pages inutiles d’un PDF',
      actionHint: 'Indiquez les numéros à supprimer, ou cliquez sur Aperçu pour choisir visuellement.',
    },
    reorder: {
      label: 'Réorganiser les pages',
      shortDesc: 'Changer l’ordre des pages d’un PDF',
      actionHint: 'Ouvrez votre PDF et déplacez les pages jusqu’à obtenir le bon ordre.',
    },
    'page-numbers': {
      label: 'Numéros de page',
      shortDesc: 'Numéroter automatiquement toutes les pages',
      actionHint: 'Ajoutez un numéro discret et lisible en haut ou en bas de chaque page.',
    },
    watermark: {
      label: 'Filigrane PDF',
      shortDesc: 'Écrire une mention (ex. : CONFIDENTIEL) sur les pages',
      actionHint: 'Ajoutez une mention discrète ou visible en travers de toutes les pages.',
    },
    'add-text': {
      label: 'Ajouter du texte',
      shortDesc: 'Écrire un mot, une date ou une note sur le PDF',
      actionHint: 'Ajoutez un nom, une date ou une remarque sur une page ou sur tout le document.',
    },
    sign: {
      label: 'Signer PDF',
      shortDesc: 'Dessiner ou taper votre signature sur le PDF',
      actionHint: 'Signez avec la souris, le doigt ou en tapant simplement votre nom.',
    },
    protect: {
      label: 'Protéger PDF',
      shortDesc: 'Demander un mot de passe pour ouvrir le PDF',
      actionHint: 'Protégez vos PDF par mot de passe sur votre appareil avant de les envoyer.',
    },
    unlock: {
      label: 'Déverrouiller PDF',
      shortDesc: 'Retirer le blocage d’impression ou de copie',
      actionHint: 'Supprimez les restrictions qui empêchent d’imprimer ou de copier le texte.',
    },
    crop: {
      label: 'Rogner les pages',
      shortDesc: 'Couper les grandes marges blanches autour du texte',
      actionHint: 'Découpez proprement les bords blancs, en-têtes ou pieds de page inutiles.',
    },
    metadata: {
      label: 'Infos du document',
      shortDesc: 'Modifier ou effacer Titre, Auteur et infos cachées',
      actionHint: 'Modifiez le titre et l’auteur enregistrés dans le fichier, ou effacez les informations cachées avant envoi.',
    },
    flatten: {
      label: 'Verrouiller le PDF',
      shortDesc: 'Empêcher de modifier formulaires, tampons et signatures',
      actionHint: 'Verrouille les champs remplis, tampons et signatures pour que personne ne puisse plus les modifier ni les déplacer.',
    },
    'stamp-image': {
      label: 'Apposer un tampon',
      shortDesc: 'Ajouter un logo ou un cachet sur vos pages PDF',
      actionHint: 'Placez un logo, un cachet de validation ou une image sur votre document.',
    },
  },
  compressQuestion: 'À quel point voulez-vous alléger vos fichiers ?',
  compressSubtitle: 'Choisissez une option ci-dessous. « Recommandé » donne le meilleur résultat dans presque tous les cas.',
  advancedSettings: 'Réglages avancés',
  hideAdvanced: 'Masquer les réglages',
  presetGentleTitle: 'Légère (Texte très net)',
  presetGentleDesc: 'Parfait pour garder les petits textes et tableaux bien nets',
  presetRecommendedTitle: 'Recommandé',
  presetRecommendedDesc: 'Très bonne qualité, fichier nettement plus léger',
  presetSmallestTitle: 'Poids minimum',
  presetSmallestDesc: 'Idéal si votre messagerie limite la taille des pièces jointes',
  presetTargetTitle: 'Taille maximum au choix',
  presetTargetDesc: 'Ne pas dépasser 1 Mo, 2 Mo, 5 Mo…',
  targetSizeLimitLabel: 'Taille maximale par fichier :',
  targetSizeCustomMb: 'Personnalisé (Mo)',
  targetResolution: 'Résolution cible',
  imageQuality: 'Qualité d’image',
  blackAndWhite: 'Convertir en noir et blanc (niveaux de gris)',
  stripExtraInfo: 'Effacer les informations cachées du fichier',
  pdfToImgFormatLabel: 'Format de sortie',
  pdfToImgClarityLabel: 'Définition',
  imgToPdfSizeLabel: 'Format de page',
  imgToPdfHint: 'Chaque photo devient une page PDF distincte et bien cadrée.',
  wordToPdfHint: 'Sélectionnez des fichiers Word (.docx) ou .txt — ou saisissez votre texte ci-dessous.',
  pdfToWordHint: 'Crée un document Word (.docx) modifiable à partir de chaque PDF.',
  paperSize: 'Format de page',
  paperA4: 'Format A4 standard',
  paperLetter: 'Format Lettre US',
  paperFit: 'Adapter à la taille de l’image',
  photoClarity: 'Qualité d’image',
  clarityStandard: 'Standard (Fichier léger)',
  clarityClear: 'Bien net (Recommandé)',
  claritySharp: 'Netteté maximale (Pour imprimer)',
  mergeFilenameLabel: 'Nom du PDF fusionné',
  mergeOrderHint: 'Utilisez les flèches Monter et Descendre dans la liste ci-dessous pour choisir l’ordre.',
  splitQuestion: 'Quelles pages voulez-vous garder ?',
  splitAllPages: 'Enregistrer chaque page dans un PDF séparé',
  splitPickNumbers: 'Choisir des numéros de pages',
  splitPagesLabel: 'Numéros de pages (exemple : 1-2, 4)',
  rotateTitle: 'Pivoter les pages',
  rotateHint: 'Tournez toutes les pages d’un coup ici, ou cliquez sur Aperçu pour corriger une seule page.',
  turnLeft: 'Pivoter à gauche (90°)',
  turnRight: 'Pivoter à droite (90°)',
  deletePagesLabel: 'Pages à retirer (exemple : 2 ou 2-3)',
  deletePagesHint: 'Ou cliquez sur Aperçu sur un PDF ci-dessous pour cocher les pages à enlever.',
  reorderTitle: 'Réorganiser les pages',
  reorderHint: 'Cliquez sur Aperçu sur un PDF ci-dessous, changez l’ordre des pages puis enregistrez.',
  reorderOpenFirst: 'Ouvrir l’organiseur de pages',
  pageNumbersPosLabel: 'Où placer les numéros',
  pageNumbersFormatLabel: 'Style d’affichage',
  pageNumbersStartLabel: 'Numéro de départ',
  pageNumbersSizeLabel: 'Taille du texte',
  posBottomLeft: 'En bas à gauche',
  posBottomCenter: 'En bas au centre',
  posBottomRight: 'En bas à droite',
  posTopLeft: 'En haut à gauche',
  posTopCenter: 'En haut au centre',
  posTopRight: 'En haut à droite',
  watermarkLabel: 'Texte du filigrane',
  watermarkPlaceLabel: 'Emplacement',
  watermarkColorLabel: 'Couleur',
  watermarkDiagonal: 'En diagonale au centre',
  watermarkHeader: 'En haut de la page',
  watermarkFooter: 'En bas de la page',
  colorSlate: 'Gris ardoise',
  colorRed: 'Rouge',
  colorBlue: 'Bleu',
  colorBlack: 'Noir',
  addTextInputLabel: 'Texte à écrire sur le PDF',
  addTextPlaceholder: 'Saisissez un texte, une date ou une note…',
  addTextPageLabel: 'Pages concernées',
  addTextPageFirst: 'Première page',
  addTextPageAll: 'Toutes les pages',
  addTextPageNumber: 'Page précise',
  addTextFontLabel: 'Style d’écriture',
  addTextPlaceLabel: 'Emplacement',
  addTextSizeLabel: 'Taille',
  placeTopLeft: 'En haut à gauche',
  placeTopCenter: 'En haut au centre',
  placeCenter: 'Au centre de la page',
  placeBottomLeft: 'En bas à gauche',
  placeBottomCenter: 'En bas au centre',
  signModeDraw: 'Dessiner',
  signModeType: 'Taper mon nom',
  signDrawPrompt: 'Tracez votre signature dans le cadre ci-dessous :',
  signClearPad: 'Effacer',
  signTypePrompt: 'Saisissez votre nom complet',
  signTypePlaceholder: 'ex. : Marie Dupont',
  signPageLabel: 'Page à signer',
  signPageLast: 'Dernière page',
  signCornerLabel: 'Emplacement',
  protectPasswordLabel: 'Mot de passe demandé à l’ouverture',
  protectPasswordPlaceholder: 'Choisissez un mot de passe solide…',
  protectAllowPrint: 'Autoriser l’impression',
  protectAllowCopy: 'Autoriser la copie du texte',
  unlockHint: 'Retire automatiquement les blocages d’impression et de copie. Saisissez un mot de passe uniquement si le fichier en demande un à l’ouverture.',
  unlockPasswordLabel: 'Mot de passe d’ouverture (si demandé)',
  unlockPasswordPlaceholder: 'Laissez vide si le PDF s’ouvre sans mot de passe',
  extractTitle: 'Enregistrer le texte du PDF',
  extractHint: 'Le format Texte simple (.txt) s’ouvre facilement dans Word ou le Bloc-notes.',
  extractTxt: 'Texte simple (.txt)',
  extractMd: 'Markdown (.md)',
  extractJson: 'JSON',
  notesHeader: 'Écrivez ou collez votre texte pour créer un PDF',
  addNotesBtn: 'Ajouter ce texte à la liste',
  noteTitlePlaceholder: 'Titre du document PDF',
  noteBodyPlaceholder: 'Saisissez ou collez votre texte ici…',
  filterAll: (n) => `Tous (${n})`,
  filterReady: (n) => `En attente (${n})`,
  filterDone: (n) => `Terminés (${n})`,
  filterSkipped: (n) => `Ignorés (${n})`,
  findFilePlaceholder: 'Rechercher un fichier…',
  removeDone: 'Retirer les terminés',
  clearList: 'Vider la liste',
  colFileName: 'Fichier',
  colBefore: 'Avant',
  colAfter: 'Après',
  colStatus: 'État',
  colActions: 'Actions',
  statusReady: 'Prêt',
  statusDone: 'Terminé',
  statusWorking: (p) => `En cours ${p} %`,
  statusSmaller: (p) => `-${p} %`,
  btnView: 'Aperçu',
  btnSave: 'Télécharger',
  btnSaveFile: 'Télécharger',
  downloadAllZip: 'Tout télécharger (ZIP)',
  workingOnFiles: 'Traitement en cours…',
  actionRunLabel: (tool, count) => {
    const noun = count === 1 ? 'fichier' : 'fichiers';
    switch (tool) {
      case 'compress':
        return `Compresser ${count} ${noun}`;
      case 'merge':
        return `Fusionner ${count} ${noun} en 1 PDF`;
      case 'split':
        return `Diviser ${count} ${noun}`;
      case 'pdf-to-images':
        return `Convertir ${count} ${noun} en images`;
      case 'images-to-pdf':
        return `Convertir ${count} ${noun} en PDF`;
      case 'word-to-pdf':
        return `Convertir ${count} ${noun} en PDF`;
      case 'pdf-to-word':
        return `Convertir ${count} ${noun} en Word`;
      case 'extract':
        return `Extraire le texte (${count})`;
      case 'rotate':
        return `Enregistrer les PDF pivotés (${count})`;
      case 'delete-pages':
        return `Supprimer les pages (${count})`;
      case 'reorder':
        return `Enregistrer l’ordre (${count})`;
      case 'page-numbers':
        return `Numéroter ${count} ${noun}`;
      case 'watermark':
        return `Appliquer le filigrane (${count})`;
      case 'add-text':
        return `Ajouter le texte (${count})`;
      case 'sign':
        return `Signer ${count} ${noun}`;
      case 'protect':
        return `Protéger ${count} ${noun}`;
      case 'unlock':
        return `Déverrouiller ${count} ${noun}`;
      case 'crop':
        return `Rogner ${count} ${noun}`;
      case 'metadata':
        return `Mettre à jour les infos (${count})`;
      case 'flatten':
        return `Verrouiller ${count} ${noun}`;
      case 'stamp-image':
        return `Appliquer le tampon (${count})`;
    }
  },
  totalFilesLabel: (n) => `${n} ${n === 1 ? 'fichier' : 'fichiers'}`,
  totalBefore: 'Avant :',
  totalNow: 'Après :',
  totalSaved: (bytes, percent) => `Économisé : ${bytes} (${percent} %)`,
  guide1Title: 'Réduire un fichier sans prise de tête',
  guide1Desc: 'L’option Recommandé réduit fortement le poids de vos PDF et photos tout en gardant un texte bien lisible.',
  guide2Title: 'Plusieurs fichiers d’un seul coup',
  guide2Desc: 'Ajoutez tous vos documents ensemble au lieu de les faire un par un, puis téléchargez tout en une fois (ZIP).',
  guide3Title: 'Que veut dire « Traitement 100 % local » ?',
  guide3Desc: 'Rien ne part sur Internet ni sur un serveur externe : tout est traité directement sur votre appareil. Vos relevés, papiers d’identité et photos restent 100 % chez vous.',
  inspectorBefore: 'Avant',
  inspectorAfter: 'Après',
  inspectorClose: 'Fermer l’aperçu',
  inspectorWordsFound: 'Texte trouvé dans le document',
  inspectorCopyAll: 'Tout copier',
  inspectorCopied: 'Copié',
  inspectorPagesTitle: 'Pages du PDF (Pivoter, réorganiser ou supprimer)',
  inspectorSavePages: 'Enregistrer les pages modifiées en PDF',
  inspectorPageNum: (n) => `Page ${n}`,
  inspectorMoveUp: 'Déplacer avant',
  inspectorMoveDown: 'Déplacer après',
  compareTabCompare: 'Comparer Avant / Après',
  compareTabPages: 'Toutes les pages',
  compareSliderLabel: 'Glissez le curseur pour comparer la netteté Avant / Après',
  compareOriginal: 'Avant (Original)',
  compareProcessed: 'Après (Traité)',
  compareLoading: 'Préparation de l’aperçu comparatif…',
  sendToNextTool: 'Continuer avec',
  sendResultsToNext: 'Envoyer les fichiers terminés vers un autre outil :',
  chainGo: 'Continuer →',
  chainedNotice: (count, toolLabel) =>
    `${count} ${count === 1 ? 'fichier envoyé' : 'fichiers envoyés'} vers « ${toolLabel} ». Prêt à lancer !`,
  cropPresetLight: 'Marge légère (5 %)',
  cropPresetMedium: 'Marge moyenne (10 %)',
  cropPresetHeaders: 'En-têtes et pieds (12 % Haut/Bas)',
  cropTopLabel: 'Haut (%)',
  cropRightLabel: 'Droite (%)',
  cropBottomLabel: 'Bas (%)',
  cropLeftLabel: 'Gauche (%)',
  cropPagesLabel: 'Appliquer le rognage à',
  metadataModeEdit: 'Modifier les infos du fichier',
  metadataModeWipe: 'Tout effacer (Confidentialité)',
  metadataLoadCurrent: 'Lire celles du 1er PDF',
  metadataTitleLabel: 'Titre du document',
  metadataAuthorLabel: 'Auteur',
  metadataSubjectLabel: 'Objet / Sujet',
  metadataKeywordsLabel: 'Mots-clés (séparés par une virgule)',
  metadataWipeHint: 'Efface complètement le titre, l’auteur, l’objet, les mots-clés et le logiciel d’origine enregistrés dans le fichier.',
  flattenModeForms: 'Verrouiller les formulaires',
  flattenModeFull: 'Verrouillage complet (PDF non modifiable)',
  flattenFormsHint: 'Empêche de modifier les champs remplis tout en gardant le texte parfaitement net et sélectionnable.',
  flattenFullHint: 'Verrouille entièrement chaque page pour qu’aucun tampon, texte ou signature ne puisse être déplacé ou modifié.',
  stampImgPickLabel: 'Choisir un logo ou tampon (PNG, JPG, WebP)',
  stampImgTrySample: 'Tampon « APPROVED » (exemple)',
  stampImgSelected: (name) => `Sélectionné : ${name}`,
  stampImgSizeLabel: 'Largeur du tampon (% de page)',
  stampImgOpacityLabel: 'Opacité',
  footerNote: 'LargePDF by xCC · Vos outils PDF rapides et confidentiels, directement sur votre appareil',
  closeNotice: 'Fermer',
};

const es: TranslationDict = {
  navShrink: 'Comprimir',
  navMerge: 'Unir PDF',
  navSplit: 'Dividir PDF',
  navSign: 'Firmar',
  navProtect: 'Proteger',
  navAllTools: 'Las 21 herramientas',
  allToolsSectionTitle: 'Las 21 herramientas para PDF y documentos',
  allToolsSectionSubtitle: 'Elige cualquier herramienta abajo para empezar al instante.',
  chooseFiles: 'Elegir archivos',
  step1PickTask: 'Paso 1 · Elige una herramienta',
  step2PickFiles: 'Paso 2 · Elige tus archivos',
  addMoreFiles: 'Añadir más archivos',
  dropHelper: 'Arrastra tus archivos aquí o pulsa «Elegir archivos» (PDF, fotos, Word o texto).',
  trySampleFiles: 'Probar con ejemplos',
  creatingSamples: 'Preparando ejemplos…',
  privateOnDevice: 'Procesamiento 100 % local',
  brandBy: 'by xCC',
  localProcessingBtnAria: 'Qué significa Procesamiento 100 % local',
  localProcessingTitle: '¿Qué significa «Procesamiento 100 % local»?',
  localProcessingExplain: 'Todo se realiza directamente en tu navegador, dentro de tu ordenador o móvil. Tus archivos no se suben a Internet ni pasan por ningún servidor externo: tus documentos privados permanecen siempre contigo.',
  noFileLimits: 'Sin límite de tamaño',
  sidebarPrivacy: '100 % privado: todo se hace en tu dispositivo y nada se sube a Internet.',
  lightMode: 'Cambiar a modo claro',
  darkMode: 'Cambiar a modo oscuro',
  lightShort: 'Claro',
  darkShort: 'Oscuro',
  languageAutoLabel: 'Auto (Dispositivo)',
  languageLabel: 'Idioma',
  batchSpeedLabel: (n) => `Velocidad (${n} ${n === 1 ? 'archivo' : 'archivos'} a la vez)`,
  groups: {
    basics: 'Herramientas esenciales',
    convert: 'Convertir y extraer',
    edit: 'Editar y firmar',
    security: 'Seguridad y privacidad',
  },
  tools: {
    compress: {
      label: 'Comprimir PDF',
      shortDesc: 'Reduce el peso de tus PDF y fotos',
      actionHint: 'Ideal para enviar por correo o liberar espacio en disco.',
    },
    merge: {
      label: 'Unir PDF',
      shortDesc: 'Combina varios PDF y fotos en uno solo',
      actionHint: 'Agrupa varios PDF e imágenes en el orden que tú decidas.',
    },
    split: {
      label: 'Dividir PDF',
      shortDesc: 'Extrae únicamente las páginas que necesitas',
      actionHint: 'Guarda cada página por separado o elige un rango específico.',
    },
    'pdf-to-images': {
      label: 'PDF a imágenes',
      shortDesc: 'Convierte páginas PDF a PNG, JPG o WebP',
      actionHint: 'Exporta cada página de tu PDF como una imagen nítida.',
    },
    'images-to-pdf': {
      label: 'Imágenes a PDF',
      shortDesc: 'Convierte fotos JPG, PNG o WebP a PDF',
      actionHint: 'Convierte tus fotografías y escaneos en documentos PDF limpios.',
    },
    'word-to-pdf': {
      label: 'Word a PDF',
      shortDesc: 'Convierte Word (.docx) o notas a PDF',
      actionHint: 'Transforma documentos Word o notas escritas en archivos PDF.',
    },
    'pdf-to-word': {
      label: 'PDF a Word',
      shortDesc: 'Convierte archivos PDF a Word editable (.docx)',
      actionHint: 'Convierte tus PDF en documentos Word fáciles de editar.',
    },
    extract: {
      label: 'Extraer texto',
      shortDesc: 'Obtén todo el contenido textual de un PDF',
      actionHint: 'Guarda el texto completo de tus PDF en texto plano, Markdown o JSON.',
    },
    rotate: {
      label: 'Rotar PDF',
      shortDesc: 'Corrige páginas giradas o al revés',
      actionHint: 'Gira documentos escaneados 90° o corrige páginas de forma individual.',
    },
    'delete-pages': {
      label: 'Eliminar páginas',
      shortDesc: 'Quita las páginas que sobran de un PDF',
      actionHint: 'Indica qué páginas eliminar o pulsa Ver para marcarlas visualmente.',
    },
    reorder: {
      label: 'Reordenar páginas',
      shortDesc: 'Cambia el orden de las páginas',
      actionHint: 'Abre un PDF y organiza las páginas hasta dejarlas en el orden correcto.',
    },
    'page-numbers': {
      label: 'Números de página',
      shortDesc: 'Agrega numeración automática al PDF',
      actionHint: 'Inserta números de página en el encabezado o pie de cada hoja.',
    },
    watermark: {
      label: 'Marca de agua',
      shortDesc: 'Estampa textos como CONFIDENCIAL',
      actionHint: 'Agrega una marca de agua clara en todas las páginas de tus PDF.',
    },
    'add-text': {
      label: 'Añadir texto a PDF',
      shortDesc: 'Escribe texto encima de cualquier página',
      actionHint: 'Inserta nombres, fechas o aclaraciones en una o en todas las páginas.',
    },
    sign: {
      label: 'Firmar PDF',
      shortDesc: 'Dibuja o escribe tu firma en el PDF',
      actionHint: 'Dibuja con el ratón/dedo o escribe tu nombre para firmar el documento.',
    },
    protect: {
      label: 'Proteger PDF',
      shortDesc: 'Pedir contraseña para abrir el PDF',
      actionHint: 'Protege tus PDF con contraseña en tu equipo antes de compartirlos.',
    },
    unlock: {
      label: 'Desbloquear PDF',
      shortDesc: 'Quita restricciones de impresión o copia',
      actionHint: 'Elimina bloqueos para poder imprimir y copiar el contenido sin trabas.',
    },
    crop: {
      label: 'Recortar páginas',
      shortDesc: 'Recorta márgenes amplios o bordes blancos',
      actionHint: 'Elimina márgenes vacíos, encabezados o pies de página en tus PDF.',
    },
    metadata: {
      label: 'Datos del PDF',
      shortDesc: 'Edita o borra Título, Autor y datos ocultos',
      actionHint: 'Actualiza Título y Autor o limpia toda la información oculta antes de enviar.',
    },
    flatten: {
      label: 'Bloquear cambios PDF',
      shortDesc: 'Impide modificar formularios, sellos y firmas',
      actionHint: 'Bloquea los campos rellenos, sellos y firmas para que nadie pueda moverlos ni editarlos.',
    },
    'stamp-image': {
      label: 'Estampar sello / logo',
      shortDesc: 'Coloca un logotipo o sello sobre las páginas',
      actionHint: 'Añade un logo de empresa, sello de aprobación o imagen a tu PDF.',
    },
  },
  compressQuestion: '¿Qué nivel de compresión prefieres?',
  compressSubtitle: 'Elige una opción. «Recomendado» ofrece el mejor equilibrio para casi todo.',
  advancedSettings: 'Ajustes avanzados',
  hideAdvanced: 'Ocultar ajustes',
  presetGentleTitle: 'Suave (Máxima nitidez)',
  presetGentleDesc: 'Ideal para documentos de texto fino',
  presetRecommendedTitle: 'Recomendado',
  presetRecommendedDesc: 'Excelente calidad, mucho menos peso',
  presetSmallestTitle: 'Compresión máxima',
  presetSmallestDesc: 'Ideal para adjuntar en correos',
  presetTargetTitle: 'Tamaño límite',
  presetTargetDesc: 'Limitar a 1 MB, 2 MB, 5 MB…',
  targetSizeLimitLabel: 'Peso máximo por archivo:',
  targetSizeCustomMb: 'Personalizado (MB)',
  targetResolution: 'Resolución objetivo',
  imageQuality: 'Calidad de imagen',
  blackAndWhite: 'Escala de grises (blanco y negro)',
  stripExtraInfo: 'Borrar información oculta del archivo',
  pdfToImgFormatLabel: 'Formato de salida',
  pdfToImgClarityLabel: 'Nitidez',
  imgToPdfSizeLabel: 'Tamaño de página',
  imgToPdfHint: 'Cada imagen se convierte en una página PDF limpia y ajustada.',
  wordToPdfHint: 'Elige archivos Word (.docx) o .txt, o escribe tus notas directamente abajo.',
  pdfToWordHint: 'Genera un documento Word (.docx) editable por cada PDF.',
  paperSize: 'Tamaño de página',
  paperA4: 'Página A4 estándar',
  paperLetter: 'Página Carta (US)',
  paperFit: 'Ajustar al tamaño de la imagen',
  photoClarity: 'Nitidez de imagen',
  clarityStandard: 'Estándar (Más ligero)',
  clarityClear: 'Alta nitidez (Recomendado)',
  claritySharp: 'Extra nítida (Para imprimir)',
  mergeFilenameLabel: 'Nombre del PDF unido',
  mergeOrderHint: 'Usa las flechas Subir / Bajar en la lista para ajustar el orden.',
  splitQuestion: '¿Qué páginas deseas extraer?',
  splitAllPages: 'Un PDF independiente por página',
  splitPickNumbers: 'Elegir páginas específicas',
  splitPagesLabel: 'Rango de páginas (ejemplo: 1-2, 4)',
  rotateTitle: 'Rotar páginas',
  rotateHint: 'Gira todas las páginas a la vez aquí o pulsa Ver para ajustar una por una.',
  turnLeft: 'Girar a la izquierda 90°',
  turnRight: 'Girar a la derecha 90°',
  deletePagesLabel: 'Páginas a eliminar (ejemplo: 2 o 2-3)',
  deletePagesHint: 'O pulsa Ver en cualquier PDF abajo para seleccionar visualmente las páginas.',
  reorderTitle: 'Reordenar páginas',
  reorderHint: 'Pulsa Ver en un PDF abajo, mueve las páginas Arriba o Abajo y guarda.',
  reorderOpenFirst: 'Abrir organizador de páginas',
  pageNumbersPosLabel: 'Posición de la numeración',
  pageNumbersFormatLabel: 'Formato',
  pageNumbersStartLabel: 'Empezar en',
  pageNumbersSizeLabel: 'Tamaño',
  posBottomLeft: 'Abajo a la izquierda',
  posBottomCenter: 'Abajo al centro',
  posBottomRight: 'Abajo a la derecha',
  posTopLeft: 'Arriba a la izquierda',
  posTopCenter: 'Arriba al centro',
  posTopRight: 'Arriba a la derecha',
  watermarkLabel: 'Texto de la marca de agua',
  watermarkPlaceLabel: 'Posición',
  watermarkColorLabel: 'Color',
  watermarkDiagonal: 'En diagonal al centro',
  watermarkHeader: 'Encabezado',
  watermarkFooter: 'Pie de página',
  colorSlate: 'Gris pizarra',
  colorRed: 'Rojo',
  colorBlue: 'Azul',
  colorBlack: 'Negro',
  addTextInputLabel: 'Texto para insertar en el PDF',
  addTextPlaceholder: 'Escribe aquí tu texto, fecha o nota…',
  addTextPageLabel: 'Páginas',
  addTextPageFirst: 'Primera página',
  addTextPageAll: 'Todas las páginas',
  addTextPageNumber: 'Página específica',
  addTextFontLabel: 'Tipografía',
  addTextPlaceLabel: 'Ubicación',
  addTextSizeLabel: 'Tamaño',
  placeTopLeft: 'Arriba a la izquierda',
  placeTopCenter: 'Arriba al centro',
  placeCenter: 'Centro de la página',
  placeBottomLeft: 'Abajo a la izquierda',
  placeBottomCenter: 'Abajo al centro',
  signModeDraw: 'Dibujar firma',
  signModeType: 'Escribir nombre',
  signDrawPrompt: 'Dibuja tu firma en el recuadro:',
  signClearPad: 'Limpiar',
  signTypePrompt: 'Escribe tu nombre completo',
  signTypePlaceholder: 'ej. Carlos García',
  signPageLabel: 'Página de firma',
  signPageLast: 'Última página',
  signCornerLabel: 'Ubicación',
  protectPasswordLabel: 'Contraseña para abrir el PDF',
  protectPasswordPlaceholder: 'Introduce una contraseña segura…',
  protectAllowPrint: 'Permitir imprimir',
  protectAllowCopy: 'Permitir copiar texto',
  unlockHint: 'Quita restricciones de impresión y copia al instante. Introduce contraseña solo si el archivo pide una para abrir.',
  unlockPasswordLabel: 'Contraseña de apertura (si tiene)',
  unlockPasswordPlaceholder: 'Déjalo vacío si abre sin contraseña',
  extractTitle: 'Exportar el texto del PDF',
  extractHint: 'El formato Texto plano (.txt) se abre en cualquier editor o en Word.',
  extractTxt: 'Texto plano (.txt)',
  extractMd: 'Markdown (.md)',
  extractJson: 'JSON',
  notesHeader: 'Escribe o pega tus notas para crear un PDF',
  addNotesBtn: 'Añadir notas a la lista',
  noteTitlePlaceholder: 'Título del documento PDF',
  noteBodyPlaceholder: 'Escribe o pega tu texto aquí…',
  filterAll: (n) => `Todos (${n})`,
  filterReady: (n) => `En cola (${n})`,
  filterDone: (n) => `Completados (${n})`,
  filterSkipped: (n) => `Omitidos (${n})`,
  findFilePlaceholder: 'Buscar archivo…',
  removeDone: 'Limpiar completados',
  clearList: 'Vaciar lista',
  colFileName: 'Archivo',
  colBefore: 'Antes',
  colAfter: 'Después',
  colStatus: 'Estado',
  colActions: 'Acciones',
  statusReady: 'En cola',
  statusDone: 'Completado',
  statusWorking: (p) => `Procesando ${p}%`,
  statusSmaller: (p) => `-${p}%`,
  btnView: 'Vista previa',
  btnSave: 'Descargar',
  btnSaveFile: 'Descargar archivo',
  downloadAllZip: 'Descargar todo (ZIP)',
  workingOnFiles: 'Procesando tus archivos…',
  actionRunLabel: (tool, count) => {
    const noun = count === 1 ? 'archivo' : 'archivos';
    switch (tool) {
      case 'compress':
        return `Comprimir ${count} ${noun}`;
      case 'merge':
        return `Unir ${count} ${noun} en 1 PDF`;
      case 'split':
        return `Dividir ${count} ${noun}`;
      case 'pdf-to-images':
        return `Convertir ${count} ${noun} a imágenes`;
      case 'images-to-pdf':
        return `Convertir ${count} ${noun} a PDF`;
      case 'word-to-pdf':
        return `Convertir ${count} ${noun} a PDF`;
      case 'pdf-to-word':
        return `Convertir ${count} ${noun} a Word`;
      case 'extract':
        return `Extraer texto (${count})`;
      case 'rotate':
        return `Guardar PDF girados (${count})`;
      case 'delete-pages':
        return `Eliminar páginas (${count})`;
      case 'reorder':
        return `Guardar orden (${count})`;
      case 'page-numbers':
        return `Numerar ${count} ${noun}`;
      case 'watermark':
        return `Aplicar marca de agua (${count})`;
      case 'add-text':
        return `Añadir texto (${count})`;
      case 'sign':
        return `Firmar ${count} ${noun}`;
      case 'protect':
        return `Proteger ${count} ${noun}`;
      case 'unlock':
        return `Desbloquear ${count} ${noun}`;
      case 'crop':
        return `Recortar ${count} ${noun}`;
      case 'metadata':
        return `Actualizar datos (${count})`;
      case 'flatten':
        return `Bloquear ${count} ${noun}`;
      case 'stamp-image':
        return `Estampar sello (${count})`;
    }
  },
  totalFilesLabel: (n) => `${n} ${n === 1 ? 'archivo' : 'archivos'}`,
  totalBefore: 'Antes:',
  totalNow: 'Después:',
  totalSaved: (bytes, percent) => `Ahorrado: ${bytes} (${percent}%)`,
  guide1Title: 'Compresión nítida sin complicaciones',
  guide1Desc: 'Elige Recomendado para reducir mucho el peso de tus PDF y fotos manteniendo una lectura clara.',
  guide2Title: 'Procesamiento por lotes',
  guide2Desc: 'Procesa varios archivos juntos en un clic y descárgalos agrupados en una carpeta ZIP.',
  guide3Title: '¿Qué significa «Procesamiento 100 % local»?',
  guide3Desc: 'Nada se sube a Internet ni a ningún servidor. Todo ocurre en tu propio equipo, así que tus facturas, contratos y fotos nunca salen de tus manos.',
  inspectorBefore: 'Antes',
  inspectorAfter: 'Después',
  inspectorClose: 'Cerrar vista previa',
  inspectorWordsFound: 'Texto extraído del documento',
  inspectorCopyAll: 'Copiar todo',
  inspectorCopied: 'Copiado',
  inspectorPagesTitle: 'Páginas del PDF (Gira, reordena o elimina)',
  inspectorSavePages: 'Guardar páginas editadas como PDF',
  inspectorPageNum: (n) => `Página ${n}`,
  inspectorMoveUp: 'Mover antes',
  inspectorMoveDown: 'Mover después',
  compareTabCompare: 'Comparar Antes / Después',
  compareTabPages: 'Todas las páginas',
  compareSliderLabel: 'Desliza para comparar nitidez Antes vs Después',
  compareOriginal: 'Antes (Original)',
  compareProcessed: 'Después (Procesado)',
  compareLoading: 'Generando vista comparativa…',
  sendToNextTool: 'Continuar con',
  sendResultsToNext: 'Enviar archivos listos a otra herramienta:',
  chainGo: 'Continuar →',
  chainedNotice: (count, toolLabel) =>
    `${count} ${count === 1 ? 'archivo enviado' : 'archivos enviados'} a «${toolLabel}». ¡Listo para ejecutar!`,
  cropPresetLight: 'Recorte suave (5%)',
  cropPresetMedium: 'Recorte medio (10%)',
  cropPresetHeaders: 'Encabezados y pies (12% arriba/abajo)',
  cropTopLabel: 'Arriba (%)',
  cropRightLabel: 'Derecha (%)',
  cropBottomLabel: 'Abajo (%)',
  cropLeftLabel: 'Izquierda (%)',
  cropPagesLabel: 'Aplicar recorte a',
  metadataModeEdit: 'Editar datos del archivo',
  metadataModeWipe: 'Borrado total (Privacidad)',
  metadataLoadCurrent: 'Leer del 1.er PDF',
  metadataTitleLabel: 'Título del documento',
  metadataAuthorLabel: 'Autor',
  metadataSubjectLabel: 'Asunto',
  metadataKeywordsLabel: 'Palabras clave (separadas por coma)',
  metadataWipeHint: 'Borra por completo Título, Autor, Asunto, Palabras clave y creador.',
  flattenModeForms: 'Bloquear formularios',
  flattenModeFull: 'Bloqueo completo (PDF no editable)',
  flattenFormsHint: 'Bloquea los campos editables conservando el texto nítido y seleccionable.',
  flattenFullHint: 'Bloquea por completo cada página para que ningún sello, texto o firma pueda moverse ni editarse.',
  stampImgPickLabel: 'Elegir logo o sello (PNG, JPG, WebP)',
  stampImgTrySample: 'Sello «APPROVED» de ejemplo',
  stampImgSelected: (name) => `Seleccionado: ${name}`,
  stampImgSizeLabel: 'Ancho del sello (% de página)',
  stampImgOpacityLabel: 'Opacidad',
  footerNote: 'LargePDF by xCC · Estudio PDF rápido y privado en tu dispositivo',
  closeNotice: 'Cerrar',
};

const pt: TranslationDict = {
  navShrink: 'Comprimir',
  navMerge: 'Juntar PDF',
  navSplit: 'Dividir PDF',
  navSign: 'Assinar',
  navProtect: 'Proteger',
  navAllTools: 'Todas as 21 ferramentas',
  allToolsSectionTitle: 'Todas as 21 ferramentas de PDF',
  allToolsSectionSubtitle: 'Selecione qualquer ferramenta abaixo para começar na hora.',
  chooseFiles: 'Escolher arquivos',
  step1PickTask: 'Passo 1 · Escolha uma ferramenta',
  step2PickFiles: 'Passo 2 · Escolha seus arquivos',
  addMoreFiles: 'Adicionar mais arquivos',
  dropHelper: 'Arraste seus arquivos aqui ou clique em «Escolher arquivos» (PDF, fotos, Word ou texto).',
  trySampleFiles: 'Testar com exemplos',
  creatingSamples: 'Preparando exemplos…',
  privateOnDevice: 'Processamento 100% local',
  brandBy: 'by xCC',
  localProcessingBtnAria: 'O que significa Processamento 100% local',
  localProcessingTitle: 'O que significa «Processamento 100% local»?',
  localProcessingExplain: 'Todo o trabalho acontece diretamente no seu navegador, dentro do seu computador ou celular. Seus arquivos não são enviados para a internet nem passam por nenhum servidor: seus documentos privados ficam apenas com você.',
  noFileLimits: 'Sem limite de tamanho',
  sidebarPrivacy: '100% privado: tudo acontece no seu aparelho e nada é enviado para a internet.',
  lightMode: 'Mudar para modo claro',
  darkMode: 'Mudar para modo escuro',
  lightShort: 'Claro',
  darkShort: 'Escuro',
  languageAutoLabel: 'Auto (Dispositivo)',
  languageLabel: 'Idioma',
  batchSpeedLabel: (n) => `Velocidade (${n} ${n === 1 ? 'arquivo' : 'arquivos'} por vez)`,
  groups: {
    basics: 'Ferramentas essenciais',
    convert: 'Converter e extrair',
    edit: 'Editar e assinar',
    security: 'Segurança e privacidade',
  },
  tools: {
    compress: {
      label: 'Comprimir PDF',
      shortDesc: 'Reduza o tamanho de PDFs e fotos',
      actionHint: 'Ótimo para enviar por e-mail ou economizar espaço no disco.',
    },
    merge: {
      label: 'Juntar PDF',
      shortDesc: 'Combine vários PDFs e fotos em um só',
      actionHint: 'Reúna vários PDFs e imagens na ordem exata que desejar.',
    },
    split: {
      label: 'Dividir PDF',
      shortDesc: 'Extraia apenas as páginas desejadas',
      actionHint: 'Salve cada página separadamente ou escolha números específicos.',
    },
    'pdf-to-images': {
      label: 'PDF para imagens',
      shortDesc: 'Converta páginas PDF em PNG, JPG ou WebP',
      actionHint: 'Exporte cada página do seu PDF como uma imagem nítida.',
    },
    'images-to-pdf': {
      label: 'Imagens para PDF',
      shortDesc: 'Converta fotos JPG, PNG ou WebP em PDF',
      actionHint: 'Transforme fotos e documentos digitalizados em PDFs organizados.',
    },
    'word-to-pdf': {
      label: 'Word para PDF',
      shortDesc: 'Converta Word (.docx) ou notas em PDF',
      actionHint: 'Transforme documentos Word ou anotações digitadas em PDF.',
    },
    'pdf-to-word': {
      label: 'PDF para Word',
      shortDesc: 'Converta PDFs em Word editável (.docx)',
      actionHint: 'Transforme seus PDFs em arquivos Word fáceis de editar.',
    },
    extract: {
      label: 'Extrair texto',
      shortDesc: 'Extraia todo o texto de um PDF',
      actionHint: 'Salve todo o conteúdo textual em texto simples, Markdown ou JSON.',
    },
    rotate: {
      label: 'Girar PDF',
      shortDesc: 'Corrija páginas tortas ou de cabeça para baixo',
      actionHint: 'Gire páginas em 90° de uma vez ou ajuste página por página.',
    },
    'delete-pages': {
      label: 'Apagar páginas',
      shortDesc: 'Remova páginas desnecessárias do PDF',
      actionHint: 'Informe os números para remover ou clique em Visualizar para escolher.',
    },
    reorder: {
      label: 'Reordenar páginas',
      shortDesc: 'Altere a ordem das páginas do PDF',
      actionHint: 'Abra um PDF e organize as páginas na sequência correta.',
    },
    'page-numbers': {
      label: 'Números de página',
      shortDesc: 'Adicione paginação automática no PDF',
      actionHint: 'Insira números limpos no cabeçalho ou rodapé de cada página.',
    },
    watermark: {
      label: 'Marca d’água',
      shortDesc: 'Aplique textos como CONFIDENCIAL',
      actionHint: 'Coloque uma marca d’água discreta ou destacada em todas as páginas.',
    },
    'add-text': {
      label: 'Adicionar texto',
      shortDesc: 'Escreva texto sobre qualquer página PDF',
      actionHint: 'Insira nomes, datas ou observações em uma ou em todas as páginas.',
    },
    sign: {
      label: 'Assinar PDF',
      shortDesc: 'Desenhe ou digite sua assinatura',
      actionHint: 'Desenhe com o mouse/dedo ou digite seu nome para assinar o PDF.',
    },
    protect: {
      label: 'Proteger PDF',
      shortDesc: 'Pedir senha para abrir o PDF',
      actionHint: 'Proteja seus PDFs com senha no seu aparelho antes de compartilhar.',
    },
    unlock: {
      label: 'Desbloquear PDF',
      shortDesc: 'Remova travas de impressão ou cópia',
      actionHint: 'Libere arquivos restritos para imprimir e copiar sem bloqueios.',
    },
    crop: {
      label: 'Cortar páginas',
      shortDesc: 'Apare margens largas ou bordas brancas',
      actionHint: 'Remova bordas vazias, cabeçalhos ou rodapés das páginas do PDF.',
    },
    metadata: {
      label: 'Dados do PDF',
      shortDesc: 'Edite ou apague Título, Autor e dados ocultos',
      actionHint: 'Atualize Título e Autor ou limpe os dados ocultos antes de enviar.',
    },
    flatten: {
      label: 'Travar edições do PDF',
      shortDesc: 'Impede alterações em formulários, carimbos e assinaturas',
      actionHint: 'Trava campos preenchidos, carimbos e assinaturas para que ninguém possa movê-los ou alterá-los.',
    },
    'stamp-image': {
      label: 'Carimbar logo / imagem',
      shortDesc: 'Aplique um logotipo ou carimbo nas páginas',
      actionHint: 'Adicione um logo da empresa, selo ou imagem sobre o seu PDF.',
    },
  },
  compressQuestion: 'Qual nível de compressão você prefere?',
  compressSubtitle: 'Escolha uma opção abaixo. «Recomendado» oferece o melhor equilíbrio.',
  advancedSettings: 'Configurações avançadas',
  hideAdvanced: 'Ocultar configurações',
  presetGentleTitle: 'Leve (Nitidez máxima)',
  presetGentleDesc: 'Melhor para documentos de texto nítido',
  presetRecommendedTitle: 'Recomendado',
  presetRecommendedDesc: 'Ótima qualidade, tamanho bem menor',
  presetSmallestTitle: 'Compactação máxima',
  presetSmallestDesc: 'Ideal para anexar em e-mails',
  presetTargetTitle: 'Tamanho limite',
  presetTargetDesc: 'Manter abaixo de 1 MB, 2 MB, 5 MB…',
  targetSizeLimitLabel: 'Tamanho máximo por arquivo:',
  targetSizeCustomMb: 'Personalizado (MB)',
  targetResolution: 'Resolução alvo',
  imageQuality: 'Qualidade da imagem',
  blackAndWhite: 'Escala de cinza (preto e branco)',
  stripExtraInfo: 'Apagar informações ocultas do arquivo',
  pdfToImgFormatLabel: 'Formato de saída',
  pdfToImgClarityLabel: 'Nitidez',
  imgToPdfSizeLabel: 'Tamanho da página',
  imgToPdfHint: 'Cada imagem vira uma página PDF limpa e bem enquadrada.',
  wordToPdfHint: 'Escolha arquivos Word (.docx) ou .txt, ou digite suas notas abaixo.',
  pdfToWordHint: 'Gera um arquivo Word (.docx) editável a partir de cada PDF.',
  paperSize: 'Tamanho da página',
  paperA4: 'Página A4 padrão',
  paperLetter: 'Página Carta (US)',
  paperFit: 'Ajustar às dimensões da imagem',
  photoClarity: 'Nitidez da foto',
  clarityStandard: 'Padrão (Arquivo menor)',
  clarityClear: 'Alta nitidez (Recomendado)',
  claritySharp: 'Extra nítida (Para impressão)',
  mergeFilenameLabel: 'Nome do PDF final',
  mergeOrderHint: 'Use as setas Subir / Descer na lista abaixo para definir a ordem.',
  splitQuestion: 'Quais páginas deseja extrair?',
  splitAllPages: 'Um arquivo PDF por página',
  splitPickNumbers: 'Selecionar páginas específicas',
  splitPagesLabel: 'Intervalo de páginas (exemplo: 1-2, 4)',
  rotateTitle: 'Girar páginas',
  rotateHint: 'Gire todas as páginas aqui ou clique em Visualizar para ajustar uma por uma.',
  turnLeft: 'Girar 90° à esquerda',
  turnRight: 'Girar 90° à direita',
  deletePagesLabel: 'Páginas para apagar (exemplo: 2 ou 2-3)',
  deletePagesHint: 'Ou clique em Visualizar em qualquer PDF abaixo para marcar visualmente.',
  reorderTitle: 'Reordenar páginas',
  reorderHint: 'Clique em Visualizar em um PDF abaixo, reordene as páginas e salve.',
  reorderOpenFirst: 'Abrir organizador de páginas',
  pageNumbersPosLabel: 'Posição da numeração',
  pageNumbersFormatLabel: 'Formato',
  pageNumbersStartLabel: 'Começar em',
  pageNumbersSizeLabel: 'Tamanho',
  posBottomLeft: 'Inferior esquerdo',
  posBottomCenter: 'Inferior central',
  posBottomRight: 'Inferior direito',
  posTopLeft: 'Superior esquerdo',
  posTopCenter: 'Superior central',
  posTopRight: 'Superior direito',
  watermarkLabel: 'Texto da marca d’água',
  watermarkPlaceLabel: 'Posição',
  watermarkColorLabel: 'Cor',
  watermarkDiagonal: 'Em diagonal no centro',
  watermarkHeader: 'Cabeçalho',
  watermarkFooter: 'Rodapé',
  colorSlate: 'Cinza ardósia',
  colorRed: 'Vermelho',
  colorBlue: 'Azul',
  colorBlack: 'Preto',
  addTextInputLabel: 'Texto para escrever no PDF',
  addTextPlaceholder: 'Digite seu texto, data ou observação aqui…',
  addTextPageLabel: 'Páginas',
  addTextPageFirst: 'Primeira página',
  addTextPageAll: 'Todas as páginas',
  addTextPageNumber: 'Página específica',
  addTextFontLabel: 'Fonte',
  addTextPlaceLabel: 'Posição',
  addTextSizeLabel: 'Tamanho',
  placeTopLeft: 'Superior esquerdo',
  placeTopCenter: 'Superior central',
  placeCenter: 'Centro da página',
  placeBottomLeft: 'Inferior esquerdo',
  placeBottomCenter: 'Inferior central',
  signModeDraw: 'Desenhar',
  signModeType: 'Digitar nome',
  signDrawPrompt: 'Desenhe sua assinatura no quadro abaixo:',
  signClearPad: 'Limpar',
  signTypePrompt: 'Digite seu nome completo',
  signTypePlaceholder: 'ex. João Silva',
  signPageLabel: 'Página para assinar',
  signPageLast: 'Última página',
  signCornerLabel: 'Posição',
  protectPasswordLabel: 'Senha para abrir o PDF',
  protectPasswordPlaceholder: 'Digite uma senha forte…',
  protectAllowPrint: 'Permitir impressão',
  protectAllowCopy: 'Permitir copiar texto',
  unlockHint: 'Remove travas de impressão e cópia automaticamente. Informe a senha apenas se o arquivo exigir para abrir.',
  unlockPasswordLabel: 'Senha de abertura (se houver)',
  unlockPasswordPlaceholder: 'Deixe vazio se o PDF abrir sem senha',
  extractTitle: 'Exportar texto do PDF',
  extractHint: 'Texto simples (.txt) abre facilmente no Bloco de Notas ou no Word.',
  extractTxt: 'Texto simples (.txt)',
  extractMd: 'Markdown (.md)',
  extractJson: 'JSON',
  notesHeader: 'Digite ou cole seu texto para criar um PDF',
  addNotesBtn: 'Adicionar notas à fila',
  noteTitlePlaceholder: 'Título do documento PDF',
  noteBodyPlaceholder: 'Digite ou cole seu texto aqui…',
  filterAll: (n) => `Todos (${n})`,
  filterReady: (n) => `Na fila (${n})`,
  filterDone: (n) => `Concluídos (${n})`,
  filterSkipped: (n) => `Ignorados (${n})`,
  findFilePlaceholder: 'Filtrar arquivos…',
  removeDone: 'Limpar concluídos',
  clearList: 'Limpar fila',
  colFileName: 'Arquivo',
  colBefore: 'Antes',
  colAfter: 'Depois',
  colStatus: 'Status',
  colActions: 'Ações',
  statusReady: 'Na fila',
  statusDone: 'Concluído',
  statusWorking: (p) => `Processando ${p}%`,
  statusSmaller: (p) => `-${p}%`,
  btnView: 'Visualizar',
  btnSave: 'Baixar',
  btnSaveFile: 'Baixar arquivo',
  downloadAllZip: 'Baixar tudo (ZIP)',
  workingOnFiles: 'Processando seus arquivos…',
  actionRunLabel: (tool, count) => {
    const noun = count === 1 ? 'arquivo' : 'arquivos';
    switch (tool) {
      case 'compress':
        return `Comprimir ${count} ${noun}`;
      case 'merge':
        return `Juntar ${count} ${noun} em 1 PDF`;
      case 'split':
        return `Dividir ${count} ${noun}`;
      case 'pdf-to-images':
        return `Converter ${count} ${noun} em imagens`;
      case 'images-to-pdf':
        return `Converter ${count} ${noun} em PDF`;
      case 'word-to-pdf':
        return `Converter ${count} ${noun} em PDF`;
      case 'pdf-to-word':
        return `Converter ${count} ${noun} em Word`;
      case 'extract':
        return `Extrair texto (${count})`;
      case 'rotate':
        return `Salvar PDFs girados (${count})`;
      case 'delete-pages':
        return `Apagar páginas (${count})`;
      case 'reorder':
        return `Salvar ordem (${count})`;
      case 'page-numbers':
        return `Numerar ${count} ${noun}`;
      case 'watermark':
        return `Aplicar marca d’água (${count})`;
      case 'add-text':
        return `Adicionar texto (${count})`;
      case 'sign':
        return `Assinar ${count} ${noun}`;
      case 'protect':
        return `Proteger ${count} ${noun}`;
      case 'unlock':
        return `Desbloquear ${count} ${noun}`;
      case 'crop':
        return `Cortar ${count} ${noun}`;
      case 'metadata':
        return `Atualizar dados (${count})`;
      case 'flatten':
        return `Travar ${count} ${noun}`;
      case 'stamp-image':
        return `Carimbar imagem (${count})`;
    }
  },
  totalFilesLabel: (n) => `${n} ${n === 1 ? 'arquivo' : 'arquivos'}`,
  totalBefore: 'Antes:',
  totalNow: 'Depois:',
  totalSaved: (bytes, percent) => `Economia: ${bytes} (${percent}%)`,
  guide1Title: 'Compressão nítida sem complicação',
  guide1Desc: 'Escolha Recomendado para diminuir bastante o peso de PDFs e fotos mantendo a leitura nítida.',
  guide2Title: 'Processamento em lote',
  guide2Desc: 'Processe vários arquivos de uma só vez e baixe tudo reunido em um arquivo ZIP.',
  guide3Title: 'O que significa «Processamento 100% local»?',
  guide3Desc: 'Nada é enviado para a internet nem para servidores externos. Tudo é processado no seu próprio computador, mantendo seus documentos e fotos sempre com você.',
  inspectorBefore: 'Antes',
  inspectorAfter: 'Depois',
  inspectorClose: 'Fechar visualização',
  inspectorWordsFound: 'Texto extraído do documento',
  inspectorCopyAll: 'Copiar tudo',
  inspectorCopied: 'Copiado',
  inspectorPagesTitle: 'Páginas deste PDF (Gire, reordene ou apague)',
  inspectorSavePages: 'Salvar páginas editadas como PDF',
  inspectorPageNum: (n) => `Página ${n}`,
  inspectorMoveUp: 'Mover antes',
  inspectorMoveDown: 'Mover depois',
  compareTabCompare: 'Comparar Antes / Depois',
  compareTabPages: 'Todas as páginas',
  compareSliderLabel: 'Arraste para comparar nitidez Antes vs Depois',
  compareOriginal: 'Antes (Original)',
  compareProcessed: 'Depois (Processado)',
  compareLoading: 'Gerando comparação…',
  sendToNextTool: 'Continuar com',
  sendResultsToNext: 'Enviar arquivos prontos para outra ferramenta:',
  chainGo: 'Continuar →',
  chainedNotice: (count, toolLabel) =>
    `${count} ${count === 1 ? 'arquivo enviado' : 'arquivos enviados'} para «${toolLabel}». Pronto para executar!`,
  cropPresetLight: 'Corte leve (5%)',
  cropPresetMedium: 'Corte médio (10%)',
  cropPresetHeaders: 'Cabeçalho e rodapé (12% topo/base)',
  cropTopLabel: 'Topo (%)',
  cropRightLabel: 'Direita (%)',
  cropBottomLabel: 'Base (%)',
  cropLeftLabel: 'Esquerda (%)',
  cropPagesLabel: 'Aplicar corte em',
  metadataModeEdit: 'Editar dados do arquivo',
  metadataModeWipe: 'Limpeza total (Privacidade)',
  metadataLoadCurrent: 'Ler do 1.º PDF',
  metadataTitleLabel: 'Título do documento',
  metadataAuthorLabel: 'Autor',
  metadataSubjectLabel: 'Assunto',
  metadataKeywordsLabel: 'Palavras-chave (separadas por vírgula)',
  metadataWipeHint: 'Apaga Título, Autor, Assunto, Palavras-chave e Criador permanentemente.',
  flattenModeForms: 'Travar formulários',
  flattenModeFull: 'Bloqueio completo (PDF não editável)',
  flattenFormsHint: 'Trava campos preenchidos mantendo o texto nítido e selecionável.',
  flattenFullHint: 'Trava completamente cada página para que nenhum carimbo, texto ou assinatura possa ser movido ou alterado.',
  stampImgPickLabel: 'Escolher logo ou carimbo (PNG, JPG, WebP)',
  stampImgTrySample: 'Carimbo «APPROVED» de exemplo',
  stampImgSelected: (name) => `Selecionado: ${name}`,
  stampImgSizeLabel: 'Largura (% da página)',
  stampImgOpacityLabel: 'Opacidade',
  footerNote: 'LargePDF by xCC · Estúdio PDF rápido e privado no seu aparelho',
  closeNotice: 'Fechar',
};

function arabicCountLabel(count: number, singular: string, dual: string, plural: string, accusative: string): string {
  if (count === 1) return singular;
  if (count === 2) return dual;
  const mod100 = count % 100;
  if (mod100 >= 3 && mod100 <= 10) return `${count} ${plural}`;
  return `${count} ${accusative}`;
}

const ar: TranslationDict = {
  navShrink: 'ضغط PDF',
  navMerge: 'دمج PDF',
  navSplit: 'تقسيم PDF',
  navSign: 'توقيع PDF',
  navProtect: 'حماية PDF',
  navAllTools: 'جميع الأدوات (٢١)',
  allToolsSectionTitle: 'جميع أدوات PDF والمستندات (٢١ أداة)',
  allToolsSectionSubtitle: 'اختر أي أداة أدناه للبدء فوراً.',
  chooseFiles: 'اختيار الملفات',
  step1PickTask: 'الخطوة ١ · اختر الأداة',
  step2PickFiles: 'الخطوة ٢ · حدّد ملفاتك',
  addMoreFiles: 'إضافة المزيد من الملفات إلى القائمة',
  dropHelper: 'اسحب الملفات وأفلتها هنا أو اضغط على «اختيار الملفات» (PDF أو صور أو Word أو نص).',
  trySampleFiles: 'تجربة بملفات جاهزة',
  creatingSamples: 'جاري تجهيز الملفات التجريبية…',
  privateOnDevice: 'معالجة محلية ١٠٠٪',
  brandBy: 'by xCC',
  localProcessingBtnAria: 'ماذا تعني المعالجة المحلية ١٠٠٪؟',
  localProcessingTitle: 'ماذا تعني «معالجة محلية ١٠٠٪»؟',
  localProcessingExplain: 'تتم جميع العمليات داخل متصفحك على جهازك مباشرة دون رفع أي ملف إلى الإنترنت أو أي خادم خارجي. مستنداتك الخاصة وصورك تبقى دائماً على جهازك ولا تغادره أبداً.',
  noFileLimits: 'بدون حد للحجم',
  sidebarPrivacy: 'خصوصية وأمان ١٠٠٪: كل شيء يتم على جهازك ولا يُرسل أي ملف إلى الإنترنت.',
  lightMode: 'التبديل إلى الوضع الفاتح',
  darkMode: 'التبديل إلى الوضع الداكن',
  lightShort: 'فاتح',
  darkShort: 'داكن',
  languageAutoLabel: 'تلقائي (الجهاز)',
  languageLabel: 'اللغة',
  batchSpeedLabel: (n) => `السرعة (${arabicCountLabel(n, 'ملف واحد', 'ملفين', 'ملفات', 'ملفاً')} في آن واحد)`,
  groups: {
    basics: 'الأدوات الأساسية',
    convert: 'التحويل والاستخراج',
    edit: 'التحرير والتوقيع',
    security: 'الأمان والخصوصية',
  },
  tools: {
    compress: {
      label: 'ضغط PDF',
      shortDesc: 'تقليل حجم ملفات PDF والصور بسهولة',
      actionHint: 'مثالي للإرسال عبر البريد الإلكتروني أو توفير مساحة التخزين.',
    },
    merge: {
      label: 'دمج PDF',
      shortDesc: 'جمع عدة ملفات PDF وصور في مستند واحد',
      actionHint: 'رتّب ملفات PDF والصور وادمجها بالتسلسل الذي تريده.',
    },
    split: {
      label: 'تقسيم PDF',
      shortDesc: 'استخراج الصفحات التي تحتاجها فقط',
      actionHint: 'احفظ كل صفحة في ملف مستقل أو حدّد أرقام صفحات معينة.',
    },
    'pdf-to-images': {
      label: 'PDF إلى صور',
      shortDesc: 'تحويل صفحات PDF إلى PNG أو JPG أو WebP',
      actionHint: 'صدّر كل صفحة من مستند PDF كملف صورة عالي الوضوح.',
    },
    'images-to-pdf': {
      label: 'صور إلى PDF',
      shortDesc: 'تحويل صور JPG أو PNG أو WebP إلى PDF',
      actionHint: 'اجمع الصور والمستندات المصورة في ملف PDF مرتّب.',
    },
    'word-to-pdf': {
      label: 'Word إلى PDF',
      shortDesc: 'تحويل مستندات Word (.docx) أو النصوص إلى PDF',
      actionHint: 'حوّل ملفات Word أو ملاحظاتك المكتوبة إلى مستند PDF جاهز.',
    },
    'pdf-to-word': {
      label: 'PDF إلى Word',
      shortDesc: 'تحويل ملفات PDF إلى Word قابل للتعديل',
      actionHint: 'حوّل مستندات PDF إلى ملفات Word (.docx) يسهل تحريرها.',
    },
    extract: {
      label: 'استخراج النص',
      shortDesc: 'استخراج جميع النصوص من ملف PDF',
      actionHint: 'احفظ نصوص المستند بصيغة نص عادي أو Markdown أو JSON.',
    },
    rotate: {
      label: 'تدوير PDF',
      shortDesc: 'تصحيح اتجاه الصفحات المائلة أو المقلوبة',
      actionHint: 'دوّر الصفحات ٩٠° يميناً أو يساراً دفعة واحدة أو صفحة بصفحة.',
    },
    'delete-pages': {
      label: 'حذف الصفحات',
      shortDesc: 'إزالة الصفحات غير المرغوب فيها من PDF',
      actionHint: 'اكتب أرقام الصفحات المطلوب حذفها أو اضغط معاينة لتحديدها.',
    },
    reorder: {
      label: 'ترتيب الصفحات',
      shortDesc: 'تعديل تسلسل صفحات ملف PDF',
      actionHint: 'افتح ملف PDF وحرّك الصفحات للأعلى أو الأسفل ثم احفظ الترتيب.',
    },
    'page-numbers': {
      label: 'ترقيم الصفحات',
      shortDesc: 'إضافة أرقام الصفحات تلقائياً',
      actionHint: 'أدرج ترقيماً واضحاً في رأس أو تذييل كل صفحة.',
    },
    watermark: {
      label: 'علامة مائية',
      shortDesc: 'إضافة عبارة مثل «سري» على كل صفحة',
      actionHint: 'ضع علامة مائية واضحة لحماية صفحات مستنداتك.',
    },
    'add-text': {
      label: 'إضافة نص إلى PDF',
      shortDesc: 'كتابة نص مخصص على أي صفحة',
      actionHint: 'أضف اسماً أو تاريخاً أو ملاحظة على صفحة واحدة أو جميع الصفحات.',
    },
    sign: {
      label: 'توقيع PDF',
      shortDesc: 'رسم أو كتابة توقيعك على المستند',
      actionHint: 'وقّع مستنداتك بالرسم اليدوي أو بكتابة اسمك بوضوح.',
    },
    protect: {
      label: 'حماية PDF',
      shortDesc: 'طلب كلمة مرور لفتح ملف PDF',
      actionHint: 'اقفل ملفاتك محلياً بكلمة مرور قبل مشاركتها.',
    },
    unlock: {
      label: 'إزالة القفل',
      shortDesc: 'فك قيود الطباعة والنسخ من PDF',
      actionHint: 'أزل القيود المفروضة على الطباعة والنسخ بكل سهولة.',
    },
    crop: {
      label: 'قص الصفحات',
      shortDesc: 'إزالة الهوامش الزائدة والحواف البيضاء',
      actionHint: 'اقصص الهوامش الفارغة أو الرأس والتذييل من صفحات PDF بدقة.',
    },
    metadata: {
      label: 'بيانات PDF',
      shortDesc: 'تعديل أو مسح العنوان والمؤلف والبيانات المخفية',
      actionHint: 'حدّث عنوان المستند والمؤلف أو امسح البيانات المخفية للخصوصية.',
    },
    flatten: {
      label: 'قفل تعديلات PDF',
      shortDesc: 'منع تعديل النماذج والتوقيعات والأختام نهائياً',
      actionHint: 'يقفل الحقول والتوقيعات والأختام في الصفحة حتى لا يتمكن أحد من تعديلها أو تحريكها.',
    },
    'stamp-image': {
      label: 'ختم شعار / صورة',
      shortDesc: 'إضافة شعار أو ختم صورة على الصفحات',
      actionHint: 'أدرج شعار مؤسستك أو ختم اعتماد أو صورة على صفحات المستند.',
    },
  },
  compressQuestion: 'ما مستوى الضغط المناسب لملفاتك؟',
  compressSubtitle: 'اختر أحد الخيارات أدناه. الخيار «موصى به» يحقق أفضل توازن لمعظم الملفات.',
  advancedSettings: 'إعدادات متقدمة',
  hideAdvanced: 'إخفاء الإعدادات',
  presetGentleTitle: 'ضغط خفيف (أعلى جودة)',
  presetGentleDesc: 'الأفضل للمستندات النصية الدقيقة',
  presetRecommendedTitle: 'موصى به',
  presetRecommendedDesc: 'جودة ممتازة مع تصغير ملحوظ للحجم',
  presetSmallestTitle: 'أقصى ضغط',
  presetSmallestDesc: 'مناسب لمرفقات البريد الإلكتروني',
  presetTargetTitle: 'الحد الأقصى للحجم',
  presetTargetDesc: 'تحت 1 MB أو 2 MB أو 5 MB…',
  targetSizeLimitLabel: 'ألا يتجاوز حجم كل ملف:',
  targetSizeCustomMb: 'مخصص (MB)',
  targetResolution: 'الدقة المستهدفة',
  imageQuality: 'جودة الصور',
  blackAndWhite: 'تحويل للأبيض والأسود',
  stripExtraInfo: 'حذف البيانات المخفية',
  pdfToImgFormatLabel: 'صيغة الصورة',
  pdfToImgClarityLabel: 'درجة الوضوح',
  imgToPdfSizeLabel: 'مقاس الصفحة',
  imgToPdfHint: 'تتحول كل صورة إلى صفحة PDF مستقلة ومرتّبة.',
  wordToPdfHint: 'اختر ملفات Word (.docx) أو .txt — أو اكتب ملاحظاتك مباشرة بالأسفل.',
  pdfToWordHint: 'ينشئ مستند Word (.docx) قابلاً للتعديل من كل ملف PDF.',
  paperSize: 'مقاس الصفحة',
  paperA4: 'صفحة A4 قياسية',
  paperLetter: 'صفحة Letter أمريكية',
  paperFit: 'مطابقة أبعاد الصورة',
  photoClarity: 'وضوح الصورة',
  clarityStandard: 'قياسي (حجم أصغر)',
  clarityClear: 'عالي الوضوح (موصى به)',
  claritySharp: 'فائق الدقة (للطباعة)',
  mergeFilenameLabel: 'اسم ملف PDF المدمج',
  mergeOrderHint: 'استخدم أسهم الأعلى والأسفل في القائمة لتعديل ترتيب الملفات.',
  splitQuestion: 'ما الصفحات التي تريد استخراجها؟',
  splitAllPages: 'حفظ كل صفحة في ملف مستقل',
  splitPickNumbers: 'تحديد أرقام صفحات',
  splitPagesLabel: 'نطاق الصفحات (مثال: 1-2, 4)',
  rotateTitle: 'تدوير الصفحات',
  rotateHint: 'دوّر جميع الصفحات معاً من هنا، أو اضغط معاينة لتعديل كل صفحة وحدها.',
  turnLeft: 'تدوير ٩٠° يساراً',
  turnRight: 'تدوير ٩٠° يميناً',
  deletePagesLabel: 'الصفحات المطلوب حذفها (مثال: 2 أو 2-3)',
  deletePagesHint: 'أو اضغط معاينة على أي ملف PDF بالأسفل لتحديد الصفحات بصرياً.',
  reorderTitle: 'إعادة ترتيب الصفحات',
  reorderHint: 'اضغط معاينة على أي ملف PDF بالأسفل ثم حرّك الصفحات واحفظ النتيجة.',
  reorderOpenFirst: 'فتح منظم الصفحات',
  pageNumbersPosLabel: 'موضع الترقيم',
  pageNumbersFormatLabel: 'نمط الترقيم',
  pageNumbersStartLabel: 'البدء من رقم',
  pageNumbersSizeLabel: 'حجم الخط',
  posBottomLeft: 'أسفل اليسار',
  posBottomCenter: 'أسفل الوسط',
  posBottomRight: 'أسفل اليمين',
  posTopLeft: 'أعلى اليسار',
  posTopCenter: 'أعلى الوسط',
  posTopRight: 'أعلى اليمين',
  watermarkLabel: 'نص العلامة المائية',
  watermarkPlaceLabel: 'الموضع',
  watermarkColorLabel: 'اللون',
  watermarkDiagonal: 'قطري في المنتصف',
  watermarkHeader: 'أعلى الصفحة',
  watermarkFooter: 'أسفل الصفحة',
  colorSlate: 'رمادي هادئ',
  colorRed: 'أحمر',
  colorBlue: 'أزرق',
  colorBlack: 'أسود داكن',
  addTextInputLabel: 'النص المراد إضافته على PDF',
  addTextPlaceholder: 'اكتب النص أو التاريخ أو الملاحظة هنا…',
  addTextPageLabel: 'الصفحات المستهدفة',
  addTextPageFirst: 'الصفحة الأولى',
  addTextPageAll: 'جميع الصفحات',
  addTextPageNumber: 'رقم صفحة محدد',
  addTextFontLabel: 'نوع الخط',
  addTextPlaceLabel: 'الموضع',
  addTextSizeLabel: 'الحجم',
  placeTopLeft: 'أعلى اليسار',
  placeTopCenter: 'أعلى الوسط',
  placeCenter: 'منتصف الصفحة',
  placeBottomLeft: 'أسفل اليسار',
  placeBottomCenter: 'أسفل الوسط',
  signModeDraw: 'رسم التوقيع',
  signModeType: 'كتابة الاسم',
  signDrawPrompt: 'ارسم توقيعك داخل الإطار أدناه:',
  signClearPad: 'مسح',
  signTypePrompt: 'اكتب اسمك الكامل',
  signTypePlaceholder: 'مثال: أحمد علي',
  signPageLabel: 'صفحة التوقيع',
  signPageLast: 'الصفحة الأخيرة',
  signCornerLabel: 'الموضع',
  protectPasswordLabel: 'كلمة مرور فتح الملف',
  protectPasswordPlaceholder: 'أدخل كلمة مرور قوية…',
  protectAllowPrint: 'السماح بالطباعة',
  protectAllowCopy: 'السماح بنسخ النص',
  unlockHint: 'يزيل قيود الطباعة والنسخ تلقائياً. أدخل كلمة المرور فقط إذا كان المستند يطلبها عند الفتح.',
  unlockPasswordLabel: 'كلمة مرور الفتح (إن وُجدت)',
  unlockPasswordPlaceholder: 'اتركه فارغاً إذا كان يفتح دون كلمة مرور',
  extractTitle: 'تصدير نص المستند',
  extractHint: 'ملف النص العادي (.txt) يُفتح بسهولة في أي محرر نصوص أو Word.',
  extractTxt: 'نص عادي (.txt)',
  extractMd: 'ماركداون (.md)',
  extractJson: 'JSON',
  notesHeader: 'اكتب أو الصق ملاحظاتك لإنشاء ملف PDF',
  addNotesBtn: 'إضافة الملاحظات للقائمة',
  noteTitlePlaceholder: 'عنوان مستند PDF',
  noteBodyPlaceholder: 'اكتب أو الصق النص هنا…',
  filterAll: (n) => `الكل (${n})`,
  filterReady: (n) => `في الانتظار (${n})`,
  filterDone: (n) => `مكتمل (${n})`,
  filterSkipped: (n) => `متخطى (${n})`,
  findFilePlaceholder: 'البحث عن ملف…',
  removeDone: 'إزالة المكتمل',
  clearList: 'إفراغ القائمة',
  colFileName: 'اسم الملف',
  colBefore: 'قبل',
  colAfter: 'بعد',
  colStatus: 'الحالة',
  colActions: 'إجراءات',
  statusReady: 'جاهز',
  statusDone: 'مكتمل',
  statusWorking: (p) => `جاري المعالجة ${p}%`,
  statusSmaller: (p) => `أصغر بـ ${p}%`,
  btnView: 'معاينة',
  btnSave: 'تنزيل',
  btnSaveFile: 'تنزيل الملف',
  downloadAllZip: 'تنزيل الكل (ZIP)',
  workingOnFiles: 'جاري معالجة ملفاتك…',
  actionRunLabel: (tool, count) => {
    const f = arabicCountLabel(count, 'ملف واحد', 'ملفين', 'ملفات', 'ملفاً');
    const img = arabicCountLabel(count, 'صورة واحدة', 'صورتين', 'صور', 'صورة');
    switch (tool) {
      case 'compress':
        return `ضغط ${f}`;
      case 'merge':
        return `دمج ${f} في PDF واحد`;
      case 'split':
        return `تقسيم ${f}`;
      case 'pdf-to-images':
        return `تحويل ${f} إلى صور`;
      case 'images-to-pdf':
        return `تحويل ${img} إلى PDF`;
      case 'word-to-pdf':
        return `تحويل ${f} إلى PDF`;
      case 'pdf-to-word':
        return `تحويل ${f} إلى Word`;
      case 'extract':
        return `استخراج النص (${count})`;
      case 'rotate':
        return `حفظ الملفات المعدّلة (${count})`;
      case 'delete-pages':
        return `حذف الصفحات (${count})`;
      case 'reorder':
        return `حفظ الترتيب (${count})`;
      case 'page-numbers':
        return `ترقيم ${f}`;
      case 'watermark':
        return `إضافة علامة مائية (${count})`;
      case 'add-text':
        return `إضافة نص (${count})`;
      case 'sign':
        return `توقيع ${f}`;
      case 'protect':
        return `حماية ${f}`;
      case 'unlock':
        return `فك قفل ${f}`;
      case 'crop':
        return `قص ${f}`;
      case 'metadata':
        return `تحديث البيانات (${count})`;
      case 'flatten':
        return `قفل تعديلات ${f}`;
      case 'stamp-image':
        return `ختم صورة (${count})`;
    }
  },
  totalFilesLabel: (n) => arabicCountLabel(n, 'ملف واحد', 'ملفان', 'ملفات', 'ملفاً'),
  totalBefore: 'قبل:',
  totalNow: 'بعد:',
  totalSaved: (bytes, percent) => `تم توفير ${bytes} (${percent}%)`,
  guide1Title: 'ضغط ذكي يحافظ على الوضوح',
  guide1Desc: 'اختر «موصى به» لتقليص حجم ملفات PDF والصور بشكل كبير مع بقاء النصوص واضحة وسهلة القراءة.',
  guide2Title: 'معالجة جماعية سريعة',
  guide2Desc: 'أضف عدة ملفات دفعة واحدة ثم نزّل جميع النتائج مجمعة في مجلد ZIP واحد.',
  guide3Title: 'ماذا تعني «معالجة محلية ١٠٠٪»؟',
  guide3Desc: 'لا يتم إرسال أي ملف عبر الإنترنت ولا حفظه على أي خادم. كل شيء يعمل داخل جهازك نفسه، لتبقى مستنداتك وصورك في أمان تام.',
  inspectorBefore: 'قبل',
  inspectorAfter: 'بعد',
  inspectorClose: 'إغلاق المعاينة',
  inspectorWordsFound: 'النص المستخرج من المستند',
  inspectorCopyAll: 'نسخ النص كاملاً',
  inspectorCopied: 'تم النسخ',
  inspectorPagesTitle: 'صفحات هذا الملف (تدوير أو ترتيب أو حذف)',
  inspectorSavePages: 'حفظ الصفحات المعدّلة كملف PDF',
  inspectorPageNum: (n) => `صفحة ${n}`,
  inspectorMoveUp: 'تقديم',
  inspectorMoveDown: 'تأخير',
  compareTabCompare: 'مقارنة قبل / بعد',
  compareTabPages: 'كل الصفحات',
  compareSliderLabel: 'اسحب المؤشر لمقارنة الدقة قبل وبعد',
  compareOriginal: 'قبل (الأصل)',
  compareProcessed: 'بعد (المعالج)',
  compareLoading: 'جاري تجهيز المقارنة…',
  sendToNextTool: 'متابعة بأداة أخرى',
  sendResultsToNext: 'إرسال الملفات الجاهزة إلى أداة أخرى:',
  chainGo: 'متابعة ←',
  chainedNotice: (count, toolLabel) =>
    `تم إرسال ${arabicCountLabel(count, 'ملف جاهز', 'ملفين جاهزين', 'ملفات جاهزة', 'ملفاً جاهزاً')} إلى «${toolLabel}». جاهز للتشغيل!`,
  cropPresetLight: 'قص خفيف (5%)',
  cropPresetMedium: 'قص متوسط (10%)',
  cropPresetHeaders: 'الرأس والتذييل (12% أعلى/أسفل)',
  cropTopLabel: 'أعلى (%)',
  cropRightLabel: 'يمين (%)',
  cropBottomLabel: 'أسفل (%)',
  cropLeftLabel: 'يسار (%)',
  cropPagesLabel: 'تطبيق القص على',
  metadataModeEdit: 'تعديل البيانات',
  metadataModeWipe: 'مسح شامل (خصوصية)',
  metadataLoadCurrent: 'قراءة من أول PDF',
  metadataTitleLabel: 'عنوان المستند',
  metadataAuthorLabel: 'المؤلف',
  metadataSubjectLabel: 'الموضوع',
  metadataKeywordsLabel: 'كلمات مفتاحية (مفصولة بفاصلة)',
  metadataWipeHint: 'يمسح العنوان والمؤلف والموضوع والكلمات المفتاحية واسم المنشئ نهائياً.',
  flattenModeForms: 'قفل النماذج',
  flattenModeFull: 'قفل كامل (PDF غير قابل للتعديل)',
  flattenFormsHint: 'يقفل حقول النماذج والتعليقات مع بقاء النصوص واضحة وقابلة للنسخ.',
  flattenFullHint: 'يقفل كل صفحة بالكامل حتى لا يتمكن أحد من تحريك أو تعديل الأختام والنصوص والتوقيعات.',
  stampImgPickLabel: 'اختيار شعار أو ختم (PNG, JPG, WebP)',
  stampImgTrySample: 'استخدام ختم «APPROVED» جاهز',
  stampImgSelected: (name) => `تم اختيار: ${name}`,
  stampImgSizeLabel: 'عرض الختم (% من الصفحة)',
  stampImgOpacityLabel: 'الشفافية',
  footerNote: 'LargePDF by xCC · أدوات PDF سريعة وخاصة على جهازك',
  closeNotice: 'إغلاق',
};

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDict> = {
  en,
  fr,
  ar,
  es,
  pt,
};

export function getTranslations(lang: SupportedLanguage): TranslationDict {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
