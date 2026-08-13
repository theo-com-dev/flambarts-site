// Compresse les images trop lourdes de public/img/ (photos uploadées via le back-office).
// Idempotent : ne touche que les images > 1600px de large ou > 500 Ko ; les autres sont ignorées.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = 'public/img';
const MAX_DIM = 1600;
const MAX_BYTES = 500 * 1024;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
let changed = 0;

for (const f of files) {
  try {
    const size = fs.statSync(f).size;
    const meta = await sharp(f).metadata();
    const tooWide = (meta.width || 0) > MAX_DIM || (meta.height || 0) > MAX_DIM;
    const tooBig = size > MAX_BYTES;
    if (!tooWide && !tooBig) continue;

    const pipeline = sharp(f).rotate().resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true });
    let out;
    if (/\.png$/i.test(f)) out = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
    else if (/\.webp$/i.test(f)) out = await pipeline.webp({ quality: 80 }).toBuffer();
    else out = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();

    if (out.length < size || tooWide) {
      fs.writeFileSync(f, out);
      changed++;
      console.log(`optimisée : ${f} (${Math.round(size / 1024)} Ko -> ${Math.round(out.length / 1024)} Ko)`);
    }
  } catch (e) {
    console.log(`ignorée : ${f} (${e.message})`);
  }
}

console.log(`${changed} image(s) optimisée(s).`);
