import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOutputFilename,
  buildTargetCompressionSteps,
  calculateSavings,
  clampConcurrency,
  computeCroppedBox,
  computeDeleteKeepIndices,
  detectFileKind,
  escapeXml,
  formatBytes,
  formatPageNumberText,
  getPresetOptions,
  isWinAnsiEncodable,
  mbToBytes,
  parsePageRanges,
  reorderArray,
  sanitizeForWinAnsi,
  summarizeBatch,
  toRomanNumeral,
} from './pdfUtils';

test('formatBytes formats byte sizes cleanly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(1536 * 1024), '1.50 MB');
  assert.equal(formatBytes(120 * 1024 * 1024), '120 MB');
});

test('calculateSavings computes positive and negative size deltas', () => {
  assert.deepEqual(calculateSavings(1000, 350), {
    savedBytes: 650,
    percent: 65,
    isSmaller: true,
  });
  assert.deepEqual(calculateSavings(1000, 1100), {
    savedBytes: -100,
    percent: -10,
    isSmaller: false,
  });
  assert.deepEqual(calculateSavings(0, 100), {
    savedBytes: 0,
    percent: 0,
    isSmaller: false,
  });
});

test('parsePageRanges parses single pages and inclusive ranges without duplicates', () => {
  assert.deepEqual(parsePageRanges('1-3, 5, 2, 7-8', 10), [1, 2, 3, 5, 7, 8]);
  assert.deepEqual(parsePageRanges('4', 4), [4]);
});

test('parsePageRanges throws helpful errors on invalid input', () => {
  assert.throws(() => parsePageRanges('', 5), /Enter at least one page/);
  assert.throws(() => parsePageRanges('5-2', 5), /start greater than end/);
  assert.throws(() => parsePageRanges('1-9', 5), /outside 1–5/);
  assert.throws(() => parsePageRanges('abc', 5), /Invalid page token/);
});

test('computeDeleteKeepIndices keeps remaining pages and prevents deleting all pages', () => {
  assert.deepEqual(computeDeleteKeepIndices(5, '2, 4-5'), [1, 3]);
  assert.throws(() => computeDeleteKeepIndices(3, '1-3'), /Keep at least 1 page/);
});

test('reorderArray moves items immutably', () => {
  assert.deepEqual(reorderArray(['a', 'b', 'c', 'd'], 2, 0), ['c', 'a', 'b', 'd']);
  assert.deepEqual(reorderArray(['a', 'b'], 0, 1), ['b', 'a']);
  assert.deepEqual(reorderArray(['a', 'b'], 0, 5), ['a', 'b']);
});

test('toRomanNumeral and formatPageNumberText format page labels accurately', () => {
  assert.equal(toRomanNumeral(1), 'i');
  assert.equal(toRomanNumeral(4), 'iv');
  assert.equal(toRomanNumeral(9), 'ix');
  assert.equal(toRomanNumeral(14), 'xiv');
  assert.equal(formatPageNumberText(3, 'numeric'), '3');
  assert.equal(formatPageNumberText(4, 'roman'), 'iv');
  assert.equal(formatPageNumberText(7, 'dashed'), '- 7 -');
});

test('sanitizeForWinAnsi, isWinAnsiEncodable, and escapeXml handle mixed text safely', () => {
  const cleaned = sanitizeForWinAnsi('“Hello” — test’s');
  assert.equal(cleaned, '"Hello" - test\'s');
  assert.equal(isWinAnsiEncodable('Café résumé'), true);
  assert.equal(isWinAnsiEncodable('مرحبا'), false);
  assert.equal(escapeXml('<note attr="a & b">'), '&lt;note attr=&quot;a &amp; b&quot;&gt;');
});

test('buildOutputFilename builds clean output names', () => {
  assert.equal(buildOutputFilename('report.pdf', 'compressed'), 'report_compressed.pdf');
  assert.equal(buildOutputFilename('deck.final.pdf', 'page1', 'png'), 'deck.final_page1.png');
  assert.equal(buildOutputFilename('notes', 'converted', '.pdf'), 'notes_converted.pdf');
});

test('clampConcurrency bounds workers between 1 and 4', () => {
  assert.equal(clampConcurrency(0), 1);
  assert.equal(clampConcurrency(2.4), 2);
  assert.equal(clampConcurrency(10), 4);
  assert.equal(clampConcurrency(Number.NaN), 2);
});

test('detectFileKind classifies pdf, image, word, text, and unsupported files', () => {
  assert.equal(detectFileKind('contract.PDF', ''), 'pdf');
  assert.equal(detectFileKind('scan.webp', 'image/webp'), 'image');
  assert.equal(detectFileKind('letter.docx', ''), 'word');
  assert.equal(detectFileKind('readme.md', ''), 'text');
  assert.equal(detectFileKind('archive.bin', 'application/octet-stream'), 'unsupported');
});

test('getPresetOptions returns distinct presets', () => {
  const lossless = getPresetOptions('lossless');
  const balanced = getPresetOptions('balanced');
  const maximum = getPresetOptions('maximum');
  assert.ok(lossless.imageQuality > balanced.imageQuality);
  assert.ok(balanced.imageQuality > maximum.imageQuality);
  assert.ok(balanced.dpi > maximum.dpi);
});

test('summarizeBatch aggregates queue counts and byte savings', () => {
  const summary = summarizeBatch([
    { status: 'done', originalSize: 1000, outputSize: 400 },
    { status: 'done', originalSize: 2000, outputSize: 1100 },
    { status: 'queued', originalSize: 5000 },
    { status: 'error', originalSize: 1000 },
  ]);
  assert.equal(summary.totalFiles, 4);
  assert.equal(summary.doneCount, 2);
  assert.equal(summary.queuedCount, 1);
  assert.equal(summary.errorCount, 1);
  assert.equal(summary.totalOriginalBytes, 9000);
  assert.equal(summary.totalOutputBytes, 1500);
  assert.equal(summary.savedBytes, 1500);
  assert.equal(summary.savedPercent, 50);
});

test('mbToBytes and target compression steps work monotonically', () => {
  assert.equal(mbToBytes(2), 2 * 1024 * 1024);
  assert.equal(mbToBytes(0.5), 512 * 1024);
  const preset = getPresetOptions('target-size', 5);
  assert.equal(preset.targetSizeMb, 5);
  const steps = buildTargetCompressionSteps();
  assert.ok(steps.length >= 4);
  for (let i = 1; i < steps.length; i++) {
    assert.ok(steps[i].quality < steps[i - 1].quality);
    assert.ok(steps[i].scaleRatio <= steps[i - 1].scaleRatio);
  }
});

test('computeCroppedBox trims page percentages accurately and guards bounds', () => {
  const cropped = computeCroppedBox(
    { x: 0, y: 0, width: 600, height: 800 },
    { topPct: 10, rightPct: 5, bottomPct: 10, leftPct: 5 }
  );
  assert.equal(cropped.x, 30);
  assert.equal(cropped.y, 80);
  assert.equal(cropped.width, 540);
  assert.equal(cropped.height, 640);

  assert.throws(
    () =>
      computeCroppedBox(
        { x: 0, y: 0, width: 60, height: 60 },
        { topPct: 30, rightPct: 30, bottomPct: 30, leftPct: 30 }
      ),
    /too small/
  );
});
