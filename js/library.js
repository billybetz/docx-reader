/**
 * Bibliothèque locale des documents récents (IndexedDB).
 * Les fichiers restent sur l'appareil.
 */

const DB_NAME = "docx-reader";
const DB_VERSION = 1;
const STORE = "documents";
const MAX_ITEMS = 20;

let dbPromise;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("openedAt", "openedAt");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

/** Identifiant stable : nom + taille + date de modification. */
export function documentId(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

/** @returns {Promise<Array<{id,name,size,openedAt,scroll}>>} sans les données binaires */
export async function listDocuments() {
  const all = await run("readonly", (s) => s.getAll());
  return all
    .sort((a, b) => b.openedAt - a.openedAt)
    .map(({ data, ...meta }) => meta);
}

export const getDocument = (id) => run("readonly", (s) => s.get(id));

export async function saveDocument({ id, name, size, data }) {
  const existing = await getDocument(id);
  await run("readwrite", (s) =>
    s.put({ id, name, size, data, openedAt: Date.now(), scroll: existing?.scroll ?? 0 })
  );
  await prune();
}

export async function saveScroll(id, scroll) {
  const doc = await getDocument(id);
  if (doc) await run("readwrite", (s) => s.put({ ...doc, scroll }));
}

export const deleteDocument = (id) => run("readwrite", (s) => s.delete(id));
export const clearDocuments = () => run("readwrite", (s) => s.clear());

async function prune() {
  const docs = await listDocuments();
  for (const old of docs.slice(MAX_ITEMS)) await deleteDocument(old.id);
}
