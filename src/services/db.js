/**
 * HUES — Chromatic Field Atlas Database Service
 * Uses client-side IndexedDB for robust, persistent offline storage of 
 * specimen records, high-resolution photographs, and metadata.
 */

const DB_NAME = 'HuesAtlasDB';
const DB_VERSION = 1;
const SPECIMEN_STORE = 'specimens';
const TREASURE_STORE = 'treasures';

let dbInstance = null;

export function openDatabase() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Primary store for chromatic specimens
      if (!db.objectStoreNames.contains(SPECIMEN_STORE)) {
        const specimenStore = db.createObjectStore(SPECIMEN_STORE, { keyPath: 'id' });
        specimenStore.createIndex('createdAt', 'createdAt', { unique: false });
        specimenStore.createIndex('refNumber', 'refNumber', { unique: true });
        specimenStore.createIndex('hex', 'hex', { unique: false });
      }

      // Secondary store for Tiny Treasures (curious non-chromatic outdoor encounters)
      if (!db.objectStoreNames.contains(TREASURE_STORE)) {
        const treasureStore = db.createObjectStore(TREASURE_STORE, { keyPath: 'id' });
        treasureStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error opening Hues database:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Get all preserved colour specimens
 * @returns {Promise<Array>} Array of specimens sorted by creation date (newest first)
 */
export async function getAllSpecimens() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SPECIMEN_STORE], 'readonly');
    const store = transaction.objectStore(SPECIMEN_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single specimen by stable identifier
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getSpecimenById(id) {
  if (!id) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SPECIMEN_STORE], 'readonly');
    const store = transaction.objectStore(SPECIMEN_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Preserve a new chromatic specimen
 * @param {Object} specimen
 * @returns {Promise<Object>}
 */
export async function saveSpecimen(specimen) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SPECIMEN_STORE], 'readwrite');
    const store = transaction.objectStore(SPECIMEN_STORE);
    const request = store.put(specimen);

    request.onsuccess = () => resolve(specimen);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an existing specimen's editable fields (name, observation, sourceDescription)
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateSpecimen(id, updates) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SPECIMEN_STORE], 'readwrite');
    const store = transaction.objectStore(SPECIMEN_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error(`Specimen with id ${id} not found.`));
        return;
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(updated);
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete a specimen permanently from the atlas
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteSpecimen(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SPECIMEN_STORE], 'readwrite');
    const store = transaction.objectStore(SPECIMEN_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Tiny Treasures methods
 */
export async function getAllTreasures() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TREASURE_STORE], 'readonly');
    const store = transaction.objectStore(TREASURE_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(results);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function saveTreasure(treasure) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TREASURE_STORE], 'readwrite');
    const store = transaction.objectStore(TREASURE_STORE);
    const request = store.put(treasure);

    request.onsuccess = () => resolve(treasure);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTreasure(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TREASURE_STORE], 'readwrite');
    const store = transaction.objectStore(TREASURE_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
