/**
 * Name of the IndexedDB database for HistorIA.
 */
export const DB_NAME = 'historia-db';
/**
 * Current database version.
 */
export const DB_VERSION = 1;

/**
 * Store names for different data types in the database.
 */
export const STORES = {
  FILE_TREE: 'fileTree',
  FILE_CONTENTS: 'fileContents',
  CHAT_HISTORY: 'chatHistory',
  SETTINGS: 'settings',
  SECURE_STORAGE: 'secureStorage'
};

/**
 * Initializes and upgrades the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
export const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Failed to open database');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORES.FILE_TREE)) {
        db.createObjectStore(STORES.FILE_TREE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.FILE_CONTENTS)) {
        db.createObjectStore(STORES.FILE_CONTENTS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.CHAT_HISTORY)) {
        db.createObjectStore(STORES.CHAT_HISTORY, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains(STORES.SECURE_STORAGE)) {
        db.createObjectStore(STORES.SECURE_STORAGE, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Gets a value from the database by store and key.
 * @template T
 * @param {string} storeName
 * @param {string} key
 * @returns {Promise<T | null>}
 */
export const getValue = async <T>(storeName: string, key: string): Promise<T | null> => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    console.log(`Getting from ${storeName}, key: ${key}`);
    const request = store.get(key);
    
    request.onsuccess = () => {
      db.close();
      console.log(`Result from ${storeName}, key: ${key}:`, request.result);
      
      if (request.result) {
        resolve((request.result.value !== undefined ? request.result.value : request.result) as T);
      } else {
        resolve(null);
      }
    };
    
    request.onerror = (event) => {
      db.close();
      console.error('Error getting value from IndexedDB:', event);
      reject('Failed to get value from database');
    };
  });
};

/**
 * Sets a value in the database by store and key.
 * @template T
 * @param {string} storeName
 * @param {string} key
 * @param {T} value
 * @returns {Promise<void>}
 */
export const setValue = async <T>(storeName: string, key: string, value: T): Promise<void> => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    let data;
    if (storeName === STORES.SETTINGS || storeName === STORES.SECURE_STORAGE) {
      data = { key, value };
    } else {
      data = { id: key, value };
    }
    
    console.log(`Saving to ${storeName}, key: ${key}`, data);
    const request = store.put(data);
    
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    
    request.onerror = (event) => {
      db.close();
      console.error('Error setting value in IndexedDB:', event);
      reject('Failed to save value to database');
    };
  });
};

/**
 * Deletes a value from the database by store and key.
 * @param {string} storeName
 * @param {string} key
 * @returns {Promise<void>}
 */
export const deleteValue = async (storeName: string, key: string): Promise<void> => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.delete(key);
    
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    
    request.onerror = (event) => {
      db.close();
      console.error('Error deleting value from IndexedDB:', event);
      reject('Failed to delete value from database');
    };
  });
};

/**
 * Gets all values from a store.
 * @template T
 * @param {string} storeName
 * @returns {Promise<T[]>}
 */
export const getAllValues = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      db.close();
      const results = request.result.map(item => 
        item.value !== undefined ? item.value : item
      );
      resolve(results as T[]);
    };
    
    request.onerror = (event) => {
      db.close();
      console.error('Error getting all values from IndexedDB:', event);
      reject('Failed to get values from database');
    };
  });
};

/**
 * Checks if a value exists in a store by key.
 * @param {string} storeName
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export const hasValue = async (storeName: string, key: string): Promise<boolean> => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.count(key);
    
    request.onsuccess = () => {
      db.close();
      resolve(request.result > 0);
    };
    
    request.onerror = (event) => {
      db.close();
      console.error('Error checking value in IndexedDB:', event);
      reject('Failed to check value in database');
    };
  });
};

/**
 * Clears all values from a store.
 * @param {string} storeName
 * @returns {Promise<void>}
 */
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.clear();
    
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    
    request.onerror = (event) => {
      db.close();
      console.error('Error clearing store in IndexedDB:', event);
      reject('Failed to clear store in database');
    };
  });
};

/**
 * Migrates persisted data from localStorage to IndexedDB.
 * @returns {Promise<void>}
 */
export const migrateFromLocalStorage = async (): Promise<void> => {
  const fileTreeKey = 'historia-filetree-v1';
  const fileTree = localStorage.getItem(fileTreeKey);
  if (fileTree) {
    await setValue(STORES.FILE_TREE, 'root', JSON.parse(fileTree));
  }
  
  const fileContentPrefix = 'historia-file-content-';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(fileContentPrefix)) {
      const fileId = key.replace(fileContentPrefix, '');
      const content = localStorage.getItem(key);
      if (content) {
        await setValue(STORES.FILE_CONTENTS, fileId, content);
      }
    }
  }
  
  const chatHistoryKey = 'historia-chat-history';
  const chatHistory = localStorage.getItem(chatHistoryKey);
  if (chatHistory) {
    await setValue(STORES.CHAT_HISTORY, 'history', JSON.parse(chatHistory));
  }
  
  const themeKey = 'theme';
  const theme = localStorage.getItem(themeKey);
  if (theme) {
    await setValue(STORES.SETTINGS, 'theme', theme);
  }
  
  const apiKeyKey = 'historia-gemini-api-key';
  const apiKey = localStorage.getItem(apiKeyKey);
  if (apiKey) {
    await setValue(STORES.SECURE_STORAGE, 'gemini-api-key', apiKey);
  }
  
  const deviceIdKey = 'historia-device-id';
  const deviceId = localStorage.getItem(deviceIdKey);
  if (deviceId) {
    await setValue(STORES.SECURE_STORAGE, 'device-id', deviceId);
  }
  
  const encryptionSaltKey = 'historia-encryption-salt';
  const encryptionSalt = localStorage.getItem(encryptionSaltKey);
  if (encryptionSalt) {
    await setValue(STORES.SECURE_STORAGE, 'encryption-salt', encryptionSalt);
  }
  
  console.log('Migration from localStorage to IndexedDB complete');
};
