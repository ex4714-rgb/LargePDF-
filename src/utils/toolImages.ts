import type { ToolId } from '../types/pdf';
import type { TranslationDict } from '../i18n/translations';
import { FolderArchive, ShieldCheck } from 'lucide-react';
import { TOOL_ICONS, TOOL_TINTS } from '../components/ToolSidebar';

import photoShrink from '../assets/images/photo_shrink_docs_1795535942681.jpg';
import photoBatch from '../assets/images/photo_batch_folder_1795535942538.jpg';
import photoPrivate from '../assets/images/photo_private_desk_1795535943425.jpg';
import photoSign from '../assets/images/photo_sign_contract_1795546008132.jpg';
import photoMerge from '../assets/images/photo_merge_docs_1795546009150.jpg';
import photoSplit from '../assets/images/photo_split_organize_1795546009580.jpg';
import photoStamp from '../assets/images/photo_stamp_seal_1795546010713.jpg';
import photoConvert from '../assets/images/photo_convert_typewriter_doc_1795546028484.jpg';
import photoCrop from '../assets/images/photo_crop_tools_1795546028050.jpg';

export const TOOL_PRIMARY_PHOTO: Record<ToolId, string> = {
  compress: photoShrink,
  merge: photoMerge,
  split: photoSplit,
  'pdf-to-images': photoConvert,
  'images-to-pdf': photoConvert,
  'word-to-pdf': photoConvert,
  'pdf-to-word': photoConvert,
  extract: photoConvert,
  rotate: photoCrop,
  'delete-pages': photoSplit,
  reorder: photoSplit,
  crop: photoCrop,
  'page-numbers': photoSplit,
  watermark: photoStamp,
  'add-text': photoStamp,
  'stamp-image': photoStamp,
  sign: photoSign,
  flatten: photoSign,
  metadata: photoPrivate,
  protect: photoPrivate,
  unlock: photoPrivate,
};

export interface GuideCardItem {
  id: string;
  stepNum: string;
  imageSrc: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export function buildDynamicGuideCards(
  activeTool: ToolId,
  t: TranslationDict
): GuideCardItem[] {
  const toolCopy = t.tools[activeTool];
  const toolTint = TOOL_TINTS[activeTool];
  const ToolIcon = TOOL_ICONS[activeTool];
  const primaryImg = TOOL_PRIMARY_PHOTO[activeTool] ?? photoShrink;

  // Tailored description for Card 1 matching active tool
  const card1Desc = `${toolCopy.shortDesc}. ${toolCopy.actionHint}`;

  return [
    {
      id: `tool-${activeTool}`,
      stepNum: '1.',
      imageSrc: primaryImg,
      title: toolCopy.label,
      desc: card1Desc,
      icon: ToolIcon,
      iconColor: toolTint.text,
    },
    {
      id: 'batch',
      stepNum: '2.',
      imageSrc: photoBatch,
      title: t.guide2Title,
      desc: t.guide2Desc,
      icon: FolderArchive,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'private',
      stepNum: '3.',
      imageSrc: photoPrivate,
      title: t.guide3Title,
      desc: t.guide3Desc,
      icon: ShieldCheck,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];
}
