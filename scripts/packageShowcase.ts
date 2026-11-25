import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function zipDirectory(sourceDir: string, outZipPath: string) {
  const zip = new JSZip();

  function addFiles(currentDir: string, zipFolder: JSZip) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      // Avoid recursive zip inclusion
      if (item.endsWith('.zip')) continue;

      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(item);
        if (subFolder) {
          addFiles(fullPath, subFolder);
        }
      } else {
        const fileData = fs.readFileSync(fullPath);
        zipFolder.file(item, fileData);
      }
    }
  }

  console.log(`Collecting files from ${sourceDir}...`);
  addFiles(sourceDir, zip);

  console.log(`Generating ZIP archive at ${outZipPath}...`);
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(outZipPath, content);
  const sizeMb = (content.length / (1024 * 1024)).toFixed(2);
  console.log(`Successfully created ZIP archive: ${outZipPath} (${sizeMb} MB)`);
}

async function main() {
  const showcaseDir = path.resolve(process.cwd(), 'showcase');
  const publicZip = path.resolve(process.cwd(), 'public/largepdf-showcase.zip');
  const showcaseZip = path.resolve(process.cwd(), 'showcase/largepdf-showcase.zip');

  await zipDirectory(showcaseDir, publicZip);
  // Also copy to showcase directory so it's directly in the root of showcase if needed
  fs.copyFileSync(publicZip, showcaseZip);
  console.log(`Copied ZIP to ${showcaseZip}`);
}

main().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
