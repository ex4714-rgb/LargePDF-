import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  detectDeviceLanguage,
  isRtlLanguage,
  normalizeLanguageTag,
} from './translations';

test('normalizeLanguageTag supports only the 5 requested languages', () => {
  assert.equal(normalizeLanguageTag('en-US'), 'en');
  assert.equal(normalizeLanguageTag('fr-FR'), 'fr');
  assert.equal(normalizeLanguageTag('ar-SA'), 'ar');
  assert.equal(normalizeLanguageTag('es-MX'), 'es');
  assert.equal(normalizeLanguageTag('pt-BR'), 'pt');
  assert.equal(normalizeLanguageTag('de-DE'), null);
  assert.equal(normalizeLanguageTag('ja-JP'), null);
});

test('detectDeviceLanguage prefers query param, then primary device language among en/fr/ar/es/pt, else en', () => {
  assert.equal(detectDeviceLanguage(['en-US'], 'en-US', '?lang=fr'), 'fr');
  assert.equal(detectDeviceLanguage(['de-DE'], 'de-DE', '?lang=de'), 'en');
  assert.equal(detectDeviceLanguage(['es-AR', 'en-US'], 'en-US', null), 'es');
  assert.equal(detectDeviceLanguage([], 'ar-EG', null), 'ar');
  assert.equal(detectDeviceLanguage(['pt-BR'], 'en-US', null), 'pt');
  assert.equal(detectDeviceLanguage(['de-DE', 'fr-FR'], 'de-DE', null), 'en');
  assert.equal(detectDeviceLanguage(['it-IT'], 'it-IT', null), 'en');
  assert.equal(detectDeviceLanguage(['zh-CN'], 'ja-JP', null), 'en');
});

test('isRtlLanguage flags Arabic as RTL and others as LTR', () => {
  assert.equal(isRtlLanguage('ar'), true);
  assert.equal(isRtlLanguage('en'), false);
  assert.equal(isRtlLanguage('fr'), false);
  assert.equal(isRtlLanguage('es'), false);
  assert.equal(isRtlLanguage('pt'), false);
});

test('all 5 supported languages define every required dictionary key', () => {
  assert.deepEqual([...SUPPORTED_LANGUAGES], ['en', 'fr', 'ar', 'es', 'pt']);
  const baseKeys = Object.keys(TRANSLATIONS.en) as (keyof typeof TRANSLATIONS.en)[];
  for (const lang of SUPPORTED_LANGUAGES) {
    const dict = TRANSLATIONS[lang];
    assert.ok(dict, `Missing dictionary for ${lang}`);
    for (const key of baseKeys) {
      assert.ok(dict[key] !== undefined && dict[key] !== '', `Missing key "${key}" in ${lang}`);
    }
    const allTools = [
      'compress',
      'merge',
      'split',
      'pdf-to-images',
      'images-to-pdf',
      'word-to-pdf',
      'pdf-to-word',
      'extract',
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
      'metadata',
      'protect',
      'unlock',
    ] as const;
    for (const toolId of allTools) {
      assert.ok(dict.tools[toolId]?.label, `Missing tool label for ${toolId} in ${lang}`);
      assert.ok(dict.actionRunLabel(toolId, 2).length > 0, `Missing actionRunLabel for ${toolId} in ${lang}`);
    }
    assert.ok(dict.totalFilesLabel(2).length > 0);
  }
});

test('arabic plural forms adapt across singular, dual, plural, and accusative counts', () => {
  assert.equal(TRANSLATIONS.ar.totalFilesLabel(1), 'ملف واحد');
  assert.equal(TRANSLATIONS.ar.totalFilesLabel(2), 'ملفان');
  assert.equal(TRANSLATIONS.ar.totalFilesLabel(4), '4 ملفات');
  assert.equal(TRANSLATIONS.ar.totalFilesLabel(12), '12 ملفاً');
  assert.equal(TRANSLATIONS.ar.actionRunLabel('compress', 1), 'ضغط ملف واحد');
  assert.equal(TRANSLATIONS.ar.actionRunLabel('compress', 2), 'ضغط ملفين');
  assert.equal(TRANSLATIONS.es.totalFilesLabel(2), '2 archivos');
});

test('flatten uses plain Verrouiller le PDF wording in French and local explanation exists in all languages', () => {
  assert.equal(TRANSLATIONS.fr.tools.flatten.label, 'Verrouiller le PDF');
  assert.equal(TRANSLATIONS.fr.actionRunLabel('flatten', 2), 'Verrouiller 2 fichiers');
  assert.ok(!TRANSLATIONS.fr.tools.flatten.label.toLowerCase().includes('figer'));
  assert.ok(!TRANSLATIONS.fr.tools.flatten.label.toLowerCase().includes('aplatir'));
  assert.ok(!TRANSLATIONS.fr.flattenFullHint.toLowerCase().includes('figé'));
  for (const lang of SUPPORTED_LANGUAGES) {
    assert.equal(TRANSLATIONS[lang].brandBy, 'by xCC');
    assert.ok(TRANSLATIONS[lang].localProcessingTitle.length > 10);
    assert.ok(TRANSLATIONS[lang].localProcessingExplain.length > 40);
  }
});
