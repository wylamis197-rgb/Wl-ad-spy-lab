const DB_NAME = 'ad-spy-lab-local';
const DB_VERSION = 1;
const STORES = ['ads', 'advertisers', 'folders', 'analyses', 'opportunities'];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir o banco local.'));
  });
}

async function transact(storeName, mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    try { result = action(store); } catch (error) { reject(error); db.close(); return; }
    tx.oncomplete = () => { db.close(); resolve(result?.result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Falha no banco local.')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Operação cancelada.')); };
  });
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
export const nowIso = () => new Date().toISOString();

export async function getAll(store) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function put(store, record) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(record);
    tx.oncomplete = () => { db.close(); resolve(record); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Não foi possível salvar.')); };
  });
}

export async function remove(store, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Não foi possível excluir.')); };
  });
}

export async function getSettings() {
  if (globalThis.chrome?.storage?.local) {
    const data = await chrome.storage.local.get('settings');
    return data.settings || { apiBaseUrl: '', accessToken: '' };
  }
  return JSON.parse(localStorage.getItem('ad-spy-settings') || '{"apiBaseUrl":"","accessToken":""}');
}

export async function saveSettings(settings) {
  if (globalThis.chrome?.storage?.local) return chrome.storage.local.set({ settings });
  localStorage.setItem('ad-spy-settings', JSON.stringify(settings));
}

export async function exportBackup() {
  const payload = { app: 'WL AD SPY LAB', version: 1, exportedAt: nowIso(), data: {} };
  for (const store of STORES) payload.data[store] = await getAll(store);
  return payload;
}

export async function importBackup(payload) {
  if (!payload || payload.app !== 'WL AD SPY LAB' || !payload.data) throw new Error('Arquivo de backup inválido.');
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const storeName of STORES) {
      const store = tx.objectStore(storeName);
      store.clear();
      const rows = Array.isArray(payload.data[storeName]) ? payload.data[storeName] : [];
      for (const row of rows) if (row && row.id) store.put(row);
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error('Falha ao restaurar backup.'));
  });
  db.close();
}

export async function exportCsv(rows) {
  const headers = ['Anunciante', 'Nicho', 'Produto', 'Tipo', 'Data de início', 'Texto', 'URL', 'Data de captura'];
  const values = rows.map(row => [row.advertiser, row.niche, row.product, row.type, row.startDate, row.copy, row.pageUrl, row.createdAt]);
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers, ...values].map(line => line.map(cell).join(';')).join('\r\n');
}
