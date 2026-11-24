import React, { useState } from 'react';
import {
  Minimize2,
  Layers,
  Scissors,
  Image as ImageIcon,
  FileImage,
  FileType2,
  FileOutput,
  FileText,
  RotateCw,
  Trash2,
  ArrowUpDown,
  Hash,
  Stamp,
  Type,
  PenTool,
  Lock,
  Unlock,
  Crop,
  ImagePlus,
  FileCheck2,
  Tags,
  ChevronDown,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import type { ToolId } from '../types/pdf';
import type { TranslationDict } from '../i18n/translations';

interface ToolSidebarProps {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  concurrency: number;
  onChangeConcurrency: (value: number) => void;
  t: TranslationDict;
}

export const TOOL_ICONS: Record<ToolId, React.ComponentType<{ className?: string }>> = {
  compress: Minimize2,
  merge: Layers,
  split: Scissors,
  'pdf-to-images': ImageIcon,
  'images-to-pdf': FileImage,
  'word-to-pdf': FileType2,
  'pdf-to-word': FileOutput,
  extract: FileText,
  rotate: RotateCw,
  'delete-pages': Trash2,
  reorder: ArrowUpDown,
  crop: Crop,
  'page-numbers': Hash,
  watermark: Stamp,
  'add-text': Type,
  'stamp-image': ImagePlus,
  sign: PenTool,
  flatten: FileCheck2,
  metadata: Tags,
  protect: Lock,
  unlock: Unlock,
};

export const TOOL_TINTS: Record<
  ToolId,
  { badge: string; activeBadge: string; text: string }
> = {
  compress: {
    badge: 'bg-teal-100/85 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300',
    activeBadge: 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950',
    text: 'text-teal-700 dark:text-teal-300',
  },
  merge: {
    badge: 'bg-amber-100/85 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
    activeBadge: 'bg-amber-500 dark:bg-amber-400 text-zinc-950',
    text: 'text-amber-700 dark:text-amber-300',
  },
  split: {
    badge: 'bg-rose-100/85 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
    activeBadge: 'bg-rose-600 dark:bg-rose-400 text-white dark:text-rose-950',
    text: 'text-rose-700 dark:text-rose-300',
  },
  'pdf-to-images': {
    badge: 'bg-orange-100/85 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300',
    activeBadge: 'bg-orange-600 dark:bg-orange-400 text-white dark:text-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
  },
  'images-to-pdf': {
    badge: 'bg-pink-100/85 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300',
    activeBadge: 'bg-pink-600 dark:bg-pink-400 text-white dark:text-pink-950',
    text: 'text-pink-700 dark:text-pink-300',
  },
  'word-to-pdf': {
    badge: 'bg-blue-100/85 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
    activeBadge: 'bg-blue-600 dark:bg-blue-400 text-white dark:text-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
  },
  'pdf-to-word': {
    badge: 'bg-sky-100/85 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300',
    activeBadge: 'bg-sky-600 dark:bg-sky-400 text-white dark:text-sky-950',
    text: 'text-sky-700 dark:text-sky-300',
  },
  extract: {
    badge: 'bg-emerald-100/85 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    activeBadge: 'bg-emerald-600 dark:bg-emerald-400 text-white dark:text-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  rotate: {
    badge: 'bg-cyan-100/85 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    activeBadge: 'bg-cyan-600 dark:bg-cyan-400 text-white dark:text-cyan-950',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  'delete-pages': {
    badge: 'bg-rose-100/85 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
    activeBadge: 'bg-rose-600 dark:bg-rose-400 text-white dark:text-rose-950',
    text: 'text-rose-700 dark:text-rose-300',
  },
  reorder: {
    badge: 'bg-amber-100/85 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
    activeBadge: 'bg-amber-500 dark:bg-amber-400 text-zinc-950',
    text: 'text-amber-700 dark:text-amber-300',
  },
  crop: {
    badge: 'bg-emerald-100/85 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    activeBadge: 'bg-emerald-600 dark:bg-emerald-400 text-white dark:text-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  'page-numbers': {
    badge: 'bg-teal-100/85 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300',
    activeBadge: 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950',
    text: 'text-teal-700 dark:text-teal-300',
  },
  watermark: {
    badge: 'bg-yellow-100/85 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
    activeBadge: 'bg-yellow-500 dark:bg-yellow-400 text-zinc-950',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  'add-text': {
    badge: 'bg-lime-100/85 dark:bg-lime-500/15 text-lime-700 dark:text-lime-300',
    activeBadge: 'bg-lime-600 dark:bg-lime-400 text-white dark:text-lime-950',
    text: 'text-lime-700 dark:text-lime-300',
  },
  'stamp-image': {
    badge: 'bg-violet-100/85 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300',
    activeBadge: 'bg-violet-600 dark:bg-violet-400 text-white dark:text-violet-950',
    text: 'text-violet-700 dark:text-violet-300',
  },
  sign: {
    badge: 'bg-indigo-100/85 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    activeBadge: 'bg-indigo-600 dark:bg-indigo-400 text-white dark:text-indigo-950',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  flatten: {
    badge: 'bg-cyan-100/85 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    activeBadge: 'bg-cyan-600 dark:bg-cyan-400 text-white dark:text-cyan-950',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  metadata: {
    badge: 'bg-sky-100/85 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300',
    activeBadge: 'bg-sky-600 dark:bg-sky-400 text-white dark:text-sky-950',
    text: 'text-sky-700 dark:text-sky-300',
  },
  protect: {
    badge: 'bg-red-100/85 dark:bg-red-500/15 text-red-700 dark:text-red-300',
    activeBadge: 'bg-red-600 dark:bg-red-400 text-white dark:text-red-950',
    text: 'text-red-700 dark:text-red-300',
  },
  unlock: {
    badge: 'bg-orange-100/85 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300',
    activeBadge: 'bg-orange-600 dark:bg-orange-400 text-white dark:text-orange-950',
    text: 'text-orange-700 dark:text-orange-300',
  },
};

export const TOOL_GROUPS: {
  groupKey: keyof TranslationDict['groups'];
  tools: ToolId[];
}[] = [
  {
    groupKey: 'basics',
    tools: ['compress', 'merge', 'split'],
  },
  {
    groupKey: 'convert',
    tools: ['pdf-to-images', 'images-to-pdf', 'word-to-pdf', 'pdf-to-word', 'extract'],
  },
  {
    groupKey: 'edit',
    tools: [
      'rotate',
      'delete-pages',
      'reorder',
      'crop',
      'page-numbers',
      'watermark',
      'add-text',
      'stamp-image',
      'sign',
      'flatten',
    ],
  },
  {
    groupKey: 'security',
    tools: ['metadata', 'protect', 'unlock'],
  },
];

export const ALL_TOOL_ORDER: ToolId[] = TOOL_GROUPS.flatMap((g) => g.tools);

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  activeTool,
  onSelectTool,
  concurrency,
  onChangeConcurrency,
  t,
}) => {
  const [showSpeed, setShowSpeed] = useState(false);

  return (
    <>
      {/* Mobile / Tablet single tool picker bar */}
      <div className="lg:hidden border-b border-[#dce3e1] dark:border-[#2c3740] bg-white dark:bg-[#181f24] px-4 py-2.5 overflow-x-auto">
        <div
          className="flex items-center gap-2 min-w-max"
          role="tablist"
          aria-label={t.step1PickTask}
        >
          {ALL_TOOL_ORDER.map((toolId) => {
            const Icon = TOOL_ICONS[toolId];
            const tint = TOOL_TINTS[toolId];
            const active = activeTool === toolId;
            return (
              <button
                key={toolId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectTool(toolId)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  active
                    ? 'bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950 font-semibold'
                    : 'bg-[#eef2f1] dark:bg-[#222b31] text-zinc-700 dark:text-[#d6e0e5] hover:bg-[#e2e9e7] dark:hover:bg-[#2a353d]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${active ? '' : tint.text}`}
                  aria-hidden="true"
                />
                <span>{t.tools[toolId].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop single left workspace tool rail */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-e border-[#dce3e1] dark:border-[#2c3740] bg-white dark:bg-[#181f24]">
        <div className="p-4 flex-1 overflow-y-auto space-y-5">
          <p className="px-2 text-xs font-semibold text-zinc-500 dark:text-[#96a7b1]">
            {t.step1PickTask}
          </p>

          <nav aria-label={t.step1PickTask} className="space-y-4">
            {TOOL_GROUPS.map((group, groupIdx) => (
              <div
                key={group.groupKey}
                className={
                  groupIdx > 0
                    ? 'pt-3 border-t border-[#eef2f1] dark:border-[#242e35]'
                    : ''
                }
              >
                <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-[#7c8f99]">
                  {t.groups[group.groupKey]}
                </p>
                <div className="space-y-0.5">
                  {group.tools.map((toolId) => {
                    const Icon = TOOL_ICONS[toolId];
                    const tint = TOOL_TINTS[toolId];
                    const active = activeTool === toolId;
                    const copy = t.tools[toolId];
                    return (
                      <button
                        key={toolId}
                        type="button"
                        onClick={() => onSelectTool(toolId)}
                        className={`w-full text-start flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                          active
                            ? 'bg-[#edf7f5] dark:bg-[#222b31] text-zinc-950 dark:text-white border border-teal-600/50 dark:border-teal-400/50 font-semibold'
                            : 'text-zinc-700 dark:text-[#c7d3da] hover:bg-[#f4f7f6] dark:hover:bg-[#1e262c] hover:text-zinc-950 dark:hover:text-white border border-transparent font-medium'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            active ? tint.activeBadge : tint.badge
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                        <span className="text-sm truncate">{copy.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#dce3e1] dark:border-[#2c3740] bg-[#f8faf9] dark:bg-[#151b20] space-y-3">
          <div>
            <button
              type="button"
              aria-expanded={showSpeed}
              onClick={() => setShowSpeed((v) => !v)}
              className="w-full flex items-center justify-between px-1 py-1 text-xs font-medium text-zinc-500 dark:text-[#96a7b1] hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.batchSpeedLabel(concurrency)}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform shrink-0 ${showSpeed ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {showSpeed && (
              <div className="mt-2 grid grid-cols-4 gap-1 p-1 bg-[#e5ecea] dark:bg-[#222b31] rounded-lg">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onChangeConcurrency(n)}
                    aria-label={`${n}x`}
                    className={`py-1.5 text-xs font-mono tabular-nums font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      concurrency === n
                        ? 'bg-white dark:bg-[#313e47] text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-[#96a7b1] hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-[#96a7b1] leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{t.sidebarPrivacy}</span>
          </p>
        </div>
      </aside>
    </>
  );
};
