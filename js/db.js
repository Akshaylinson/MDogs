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

async function run(storeName, mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store, tx);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getAll(storeName) {
  return run(storeName, "readonly", (store) => new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}

export async function getById(storeName, id) {
  if (!id) return null;
  return run(storeName, "readonly", (store) => new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export async function put(storeName, value) {
  return run(storeName, "readwrite", (store) => new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export async function bulkPut(storeName, values) {
  return run(storeName, "readwrite", (store) => {
    for (const value of values) store.put(value);
    return true;
  });
}

export async function del(storeName, id) {
  return run(storeName, "readwrite", (store) => new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  }));
}

export async function clearStore(storeName) {
  return run(storeName, "readwrite", (store) => new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  }));
}

export async function count(storeName) {
  return run(storeName, "readonly", (store) => new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  }));
}

export async function getAllByIndex(storeName, indexName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const index = tx.objectStore(storeName).index(indexName);
    const req = index.getAll(key);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getFirstByIndex(storeName, indexName, key) {
  if (!key) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const index = tx.objectStore(storeName).index(indexName);
    const req = index.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getSettingsMap() {
  const items = await getAll("settings");
  return Object.fromEntries(items.map((item) => [item.key, item.value]));
}

export async function setSetting(key, value) {
  return put("settings", { key, value });
}

export async function getSetting(key, fallback = null) {
  const item = await getById("settings", key);
  return item ? item.value : fallback;
}

export async function initDefaults() {
  const theme = await getSetting("theme");
  if (theme == null) await setSetting("theme", "system");
  const galleryView = await getSetting("galleryView");
  if (galleryView == null) await setSetting("galleryView", "grid");
  const slideshowInterval = await getSetting("slideshowInterval");
  if (slideshowInterval == null) await setSetting("slideshowInterval", 5);
}

export async function getDB() {
  return openDB();
}

export async function initDB() {
  return openDB();
}
