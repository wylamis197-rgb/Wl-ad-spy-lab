import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { deflateRawSync, gunzipSync } from 'node:zlib';
import { relative, resolve, sep } from 'node:path';

const root = process.cwd();
const out = resolve(root, 'extension-dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(resolve(root, 'public'), out, { recursive: true });
await cp(resolve(root, 'src/sidepanel'), resolve(out, 'sidepanel'), { recursive: true });
await cp(resolve(root, 'src/dashboard'), resolve(out, 'dashboard'), { recursive: true });
await cp(resolve(root, 'src/lib'), resolve(out, 'lib'), { recursive: true });
await writeFile(resolve(out, 'app.js'), gunzipSync(await readFile(resolve(root, 'src/app.js.gz'))));
await writeFile(resolve(out, 'extras.js'), await readFile(resolve(root, 'src/extras.js')));
await writeFile(resolve(out, 'remove-zenly.js'), await readFile(resolve(root, 'src/remove-zenly.js')));
await mkdir(resolve(out, 'styles'), { recursive: true });
await writeFile(resolve(out, 'styles/app.css'), gunzipSync(await readFile(resolve(root, 'src/styles/app.css.gz'))));
await cp(resolve(root, 'src/styles/override.css'), resolve(out, 'styles/override.css'));
await cp(resolve(root, 'src/background/service-worker.js'), resolve(out, 'background.js'));

const run = promisify(execFile);
for (const file of ['app.js', 'extras.js', 'remove-zenly.js', 'background.js']) {
  await run(process.execPath, ['--check', resolve(out, file)]);
}

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  return value >>> 0;
});
function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}
function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}
async function writeExtensionZip() {
  const files = await walk(out);
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = dosDateTime(new Date());

  for (const absolute of files) {
    const name = relative(out, absolute).split(sep).join('/');
    const nameBytes = Buffer.from(name, 'utf8');
    const original = await readFile(absolute);
    const compressed = deflateRawSync(original, { level: 9 });
    const checksum = crc32(original);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(original.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBytes, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(original.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  await writeFile(
    resolve(out, 'WL_AD_SPY_LAB_v0.6.1.zip'),
    Buffer.concat([...localParts, centralDirectory, end])
  );
}
await writeExtensionZip();
console.log('WL AD SPY LAB v0.6.1: extensão gratuita com interface black/gold validada e ZIP instalável gerado em extension-dist/.');
