import React, { useEffect, useRef, useState } from 'react';
import { FileText, FolderOpen, Globe, HelpCircle, Lock, Moon, Sun, X } from 'lucide-react';
import type { ToolId } from '../types/pdf';
import {
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
  type LanguagePreference,
  type TranslationDict,
} from '../i18n/translations';

interface TopBarProps {
  onSelectTool: (tool: ToolId) => void;
  onTriggerUpload: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  languagePref: LanguagePreference;
  onChangeLanguagePref: (pref: LanguagePreference) => void;
  t: TranslationDict;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSelectTool,
  onTriggerUpload,
  theme,
  onToggleTheme,
  languagePref,
  onChangeLanguagePref,
  t,
}) => {
  const [showLocalInfo, setShowLocalInfo] = useState(false);
  const localPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showLocalInfo) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        localPopoverRef.current &&
        !localPopoverRef.current.contains(e.target as Node)
      ) {
        setShowLocalInfo(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLocalInfo(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLocalInfo]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#181f24]/95 backdrop-blur border-b border-[#dce3e1] dark:border-[#2c3740]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTool('compress');
            }}
            className="inline-flex items-center gap-2.5 text-zinc-900 dark:text-[#f2f6f7] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
          >
            <span className="w-8 h-8 rounded-md bg-teal-700 dark:bg-teal-400 text-white dark:text-teal-950 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-tight">
                LargePDF
              </span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-[#96a7b1] mt-0.5">
                {t.brandBy}
              </span>
            </span>
          </a>

          <div
            ref={localPopoverRef}
            className="relative hidden md:inline-flex items-center border-s border-[#dce3e1] dark:border-[#2c3740] ps-4"
          >
            <button
              type="button"
              aria-expanded={showLocalInfo}
              aria-label={t.localProcessingBtnAria}
              onClick={() => setShowLocalInfo((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-[#b4c2cb] hover:text-zinc-900 dark:hover:text-white py-1 px-1.5 rounded-md hover:bg-[#eef2f1] dark:hover:bg-[#222b31] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Lock
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span>{t.privateOnDevice}</span>
              <HelpCircle
                className="w-3.5 h-3.5 text-zinc-400 dark:text-[#7c8f99] shrink-0"
                aria-hidden="true"
              />
            </button>

            {showLocalInfo && (
              <div
                role="dialog"
                aria-label={t.localProcessingTitle}
                className="absolute top-full start-4 mt-2 w-80 p-3.5 rounded-lg bg-white dark:bg-[#1e272d] border border-[#cfd9d6] dark:border-[#32404a] shadow-lg z-40 text-start"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <Lock
                      className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{t.localProcessingTitle}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowLocalInfo(false)}
                    aria-label={t.closeNotice}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-zinc-600 dark:text-[#b4c2cb] leading-relaxed">
                  {t.localProcessingExplain}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <label className="relative inline-flex items-center">
            <Globe
              className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 absolute start-2.5 pointer-events-none"
              aria-hidden="true"
            />
            <select
              aria-label={t.languageLabel}
              value={languagePref}
              onChange={(e) =>
                onChangeLanguagePref(e.target.value as LanguagePreference)
              }
              className="h-9 ps-8 pe-2.5 text-xs sm:text-sm font-medium text-zinc-800 dark:text-[#e6edf0] bg-[#f4f7f6] dark:bg-[#222b31] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="auto">{t.languageAutoLabel}</option>
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {LANGUAGE_NATIVE_NAMES[code]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs sm:text-sm font-medium text-zinc-800 dark:text-[#e6edf0] bg-[#f4f7f6] dark:bg-[#222b31] hover:bg-[#e5ecea] dark:hover:bg-[#2a353d] border border-[#cfd9d6] dark:border-[#32404a] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {theme === 'dark' ? t.lightShort : t.darkShort}
            </span>
          </button>

          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-2 h-9 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-400 dark:hover:bg-teal-300 dark:text-teal-950 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#181f24]"
          >
            <FolderOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.chooseFiles}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
