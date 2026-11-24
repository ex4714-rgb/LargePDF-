import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { buildDocxFromPages } from './pdfEngine';

async function renderChartPngBytes(title: string, accentHex: string, bars: number[]): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create chart canvas.');
  }

  const grad = ctx.createLinearGradient(0, 0, 1400, 840);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1400, 840);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  for (let y = 160; y <= 700; y += 90) {
    ctx.beginPath();
    ctx.moveTo(100, y);
    ctx.lineTo(1300, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(title, 100, 96);

  const maxBar = Math.max(...bars, 1);
  const barWidth = Math.floor(1060 / bars.length) - 24;
  bars.forEach((val, idx) => {
    const h = Math.round((val / maxBar) * 480);
    const x = 120 + idx * (barWidth + 24);
    const y = 700 - h;
    ctx.fillStyle = accentHex;
    ctx.fillRect(x, y, barWidth, h);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${val}%`, x + 12, y - 14);
    ctx.fillText(`Q${idx + 1}`, x + 16, 745);
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed.'))), 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

async function buildRichPdf(options: {
  title: string;
  subtitle: string;
  accentHex: string;
  bars: number[];
  paragraphs: string[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(options.title);
  doc.setAuthor('LargePDF Sample Suite');
  doc.setSubject('Sample document for compression, conversion, and batch testing');
  doc.setKeywords(['sample', 'report', 'batch', 'compression']);

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const page1 = doc.addPage([612, 792]);
  page1.drawRectangle({ x: 0, y: 710, width: 612, height: 82, color: rgb(0.06, 0.09, 0.16) });
  page1.drawText(options.title, { x: 48, y: 745, size: 22, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText(options.subtitle, { x: 48, y: 722, size: 11, font: fontRegular, color: rgb(0.8, 0.85, 0.92) });

  const chartBytes = await renderChartPngBytes(options.title, options.accentHex, options.bars);
  const embeddedChart = await doc.embedPng(chartBytes);
  page1.drawImage(embeddedChart, { x: 48, y: 360, width: 516, height: 310 });

  let y = 320;
  for (const para of options.paragraphs) {
    page1.drawText(para, {
      x: 48,
      y,
      size: 11,
      font: fontRegular,
      color: rgb(0.15, 0.2, 0.29),
      maxWidth: 516,
      lineHeight: 16,
    });
    y -= 64;
  }

  const page2 = doc.addPage([612, 792]);
  page2.drawText(`${options.title} — Appendix & Metrics`, {
    x: 48,
    y: 740,
    size: 16,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  page2.drawText(
    'This second page provides structured multi-page text for splitting, rotating, watermarking, and text extraction tests.',
    {
      x: 48,
      y: 712,
      size: 11,
      font: fontRegular,
      color: rgb(0.25, 0.32, 0.42),
      maxWidth: 516,
    }
  );
  page2.drawImage(embeddedChart, { x: 48, y: 360, width: 516, height: 310 });

  return doc.save({ useObjectStreams: false });
}

export interface GeneratedSampleFile {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
}

export async function generateSampleBatchFiles(forWordTool = false): Promise<GeneratedSampleFile[]> {
  if (forWordTool) {
    const [letterBlob, checklistBlob] = await Promise.all([
      buildDocxFromPages('Community_Notice_2026', [
        {
          page: 1,
          text:
            'Annual Home & Garden Reminder\n\n' +
            'Dear Neighbor,\n' +
            'Please remember that spring pickup starts Monday at 8:00 AM. Bundle branches neatly beside the curb.\n\n' +
            'Questions? Call the neighborhood office between 9:00 AM and 4:00 PM.',
        },
      ]),
      buildDocxFromPages('Travel_Checklist', [
        {
          page: 1,
          text:
            'Trip Packing & Documents Checklist\n\n' +
            '1. Passport and boarding passes\n' +
            '2. Emergency contact card and medication list\n' +
            '3. Phone charger and travel adapter\n' +
            '4. Hotel confirmation number',
        },
      ]),
    ]);

    return [
      {
        name: 'Community_Notice_2026.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        bytes: new Uint8Array(await letterBlob.arrayBuffer()),
      },
      {
        name: 'Travel_Checklist.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        bytes: new Uint8Array(await checklistBlob.arrayBuffer()),
      },
    ];
  }

  const [deckPdf, briefPdf, invoicePdf, diagramPng] = await Promise.all([
    buildRichPdf({
      title: 'Q4 Operational Efficiency Report',
      subtitle: 'Regional throughput, storage reduction, and batch conversion benchmarks',
      accentHex: '#2563eb',
      bars: [42, 58, 74, 89],
      paragraphs: [
        'Executive Summary: Moving archival document pipelines to browser-native compression reduced outbound storage footprints by 64% across regional offices.',
        'Batch queues allow parallel processing of contracts, engineering drawings, and monthly statements directly on employee devices.',
      ],
    }),
    buildRichPdf({
      title: 'System Architecture Brief',
      subtitle: 'Zero-upload client processing and memory-safe document pipelines',
      accentHex: '#0f766e',
      bars: [65, 72, 81, 94],
      paragraphs: [
        'Security Guarantee: Sensitive financial and legal records stay inside local browser memory from intake through final ZIP export.',
        'Format Support: Seamless conversion between PDF, PNG, JPEG, WebP, and plain text without external server roundtrips.',
      ],
    }),
    buildRichPdf({
      title: 'Invoice Statement #2026-084',
      subtitle: 'Client: Northwind Logistics · Net 30 · Consolidated PDF Archive',
      accentHex: '#4f46e5',
      bars: [35, 48, 62, 79],
      paragraphs: [
        'Line Item 01: Document Digitization & Optical Compression Suite — 420 pages processed in local batch queue.',
        'Line Item 02: High-DPI Rasterization and Watermark Compliance Audit — Verified ready for external distribution.',
      ],
    }),
    renderChartPngBytes('Product Architecture Diagram', '#2563eb', [50, 70, 88, 96]),
  ]);

  return [
    { name: 'Q4_Operational_Report.pdf', mimeType: 'application/pdf', bytes: deckPdf },
    { name: 'System_Architecture_Brief.pdf', mimeType: 'application/pdf', bytes: briefPdf },
    { name: 'Invoice_2026_084.pdf', mimeType: 'application/pdf', bytes: invoicePdf },
    { name: 'Product_Diagram_Export.png', mimeType: 'image/png', bytes: diagramPng },
  ];
}
