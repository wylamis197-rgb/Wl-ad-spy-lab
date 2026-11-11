import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';

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
await cp(resolve(root, 'src/background/service-worker.js'), resolve(out, 'background.js'));
console.log('WL AD SPY LAB v0.3.0: extensão pronta em extension-dist/.');
