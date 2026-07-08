const DB_NAME = "PersonalMediaArchiveDB";
const DB_VERSION = 1;

let dbPromise;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("categories")) {
          const store = db.createObjectStore("categories", { keyPath: "id" });
          store.createIndex("name", "name", { unique: false });
          store.createIndex("slug", "slug", { unique: true });
        }
        if (!db.objectStoreNames.contains("media")) {
          const store = db.createObjectStore("media", { keyPath: "id" });
          store.createIndex("categoryId", "categoryId", { unique: false });
          store.createIndex("mediaType", "mediaType", { unique: false });
          store.createIndex("isFavorite", "isFavorite", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("tags")) {
          db.createObjectStore("tags", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

// ── Core transaction helper ───────────────────────────────────────────────────
// Resolves with `value` only after the transaction fully commits (oncomplete).
async function tx(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    let value;
    transaction.oncomplete = () => resolve(value);
    transaction.onerror   = () => reject(transaction.error);
    transaction.onabort   = () => reject(transaction.error);
    const store = transaction.objectStore(storeName);
    const req = fn(store);
    if (req && typeof req.then === "function") {
      // promise returned — wait for it then let oncomplete resolve
      req.then((v) => { value = v; }).catch(reject);
    } else if (req && req.onsuccess !== undefined) {
      // IDBRequest returned
      req.onsuccess = () => { value = req.result; };
      req.onerror   = () => reject(req.error);
    } else {
      value = req;
    }
  });
}

export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const req = transaction.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

export async function getById(storeName, id) {
  if (!id) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const req = transaction.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

export async function put(storeName, value) {
  return tx(storeName, "readwrite", (store) => store.put(value));
}

// Batch-put multiple rows in a single transaction — much faster than looping put()
export async function bulkPut(storeName, values) {
  if (!values.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    transaction.oncomplete = () => resolve();
    transaction.onerror   = () => reject(transaction.error);
    transaction.onabort   = () => reject(transaction.error);
    for (const v of values) store.put(v);
  });
}

export async function del(storeName, id) {
  return tx(storeName, "readwrite", (store) => store.delete(id));
}

// Batch-delete multiple ids in a single transaction
export async function bulkDel(storeName, ids) {
  if (!ids.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    transaction.oncomplete = () => resolve();
    transaction.onerror   = () => reject(transaction.error);
    transaction.onabort   = () => reject(transaction.error);
    for (const id of ids) store.delete(id);
  });
}

export async function clearStore(storeName) {
  return tx(storeName, "readwrite", (store) => store.clear());
}

export async function count(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const req = transaction.objectStore(storeName).count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror   = () => reject(req.error);
  });
}

export async function getAllByIndex(storeName, indexName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const req = transaction.objectStore(storeName).index(indexName).getAll(key);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

export async function getFirstByIndex(storeName, indexName, key) {
  if (!key) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const req = transaction.objectStore(storeName).index(indexName).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

export async function getSettingsMap() {
  const items = await getAll("settings");
  return Object.fromEntries(items.map((i) => [i.key, i.value]));
}

export async function setSetting(key, value) {
  return put("settings", { key, value });
}

export async function getSetting(key, fallback = null) {
  const item = await getById("settings", key);
  return item ? item.value : fallback;
}

export async function initDefaults() {
  const [theme, galleryView, slideshowInterval] = await Promise.all([
    getSetting("theme"),
    getSetting("galleryView"),
    getSetting("slideshowInterval"),
  ]);
  const defaults = [];
  if (theme           == null) defaults.push({ key: "theme",             value: "system" });
  if (galleryView     == null) defaults.push({ key: "galleryView",       value: "grid"   });
  if (slideshowInterval == null) defaults.push({ key: "slideshowInterval", value: 5      });
  if (defaults.length) await bulkPut("settings", defaults);
}

export async function getDB()  { return openDB(); }
export async function initDB() { return openDB(); }
