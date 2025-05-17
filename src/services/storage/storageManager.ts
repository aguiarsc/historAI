import { 
  DB_NAME, 
  DB_VERSION, 
  STORES, 
  initDatabase,
  getValue as getValueFromDB,
  setValue as setValueToDB,
  deleteValue as deleteValueFromDB,
  getAllValues as getAllValuesFromDB,
  clearStore as clearStoreFromDB
} from './db';

export const StorageState = {
  AVAILABLE: 'available',
  DEGRADED: 'degraded',
  UNAVAILABLE: 'unavailable'
} as const;

export type StorageState = typeof StorageState[keyof typeof StorageState];

export const StorageErrorType = {
  INITIALIZATION: 'initialization',
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  QUOTA_EXCEEDED: 'quota_exceeded',
  PERMISSION_DENIED: 'permission_denied',
  UNKNOWN: 'unknown'
} as const;

export type StorageErrorType = typeof StorageErrorType[keyof typeof StorageErrorType];

export interface StorageError {
  name: string;
  message: string;
  type: StorageErrorType;
  originalError?: any;
}

export function createStorageError(message: string, type: StorageErrorType, originalError?: any): StorageError {
  return {
    name: 'StorageError',
    message,
    type,
    originalError
  };
}

let currentStorageState: StorageState = StorageState.AVAILABLE;

const MAX_RETRIES = 3;

const RETRY_DELAY = 500;
export async function checkIndexedDBAvailability(): Promise<boolean> {
  if (!window.indexedDB) {
    return false;
  }
  
  try {
    const request = indexedDB.open('historia-test-db', 1);
    
    return await new Promise<boolean>((resolve) => {
      request.onerror = () => {
        resolve(false);
      };
      
      request.onsuccess = () => {
        request.result.close();
        try {
          indexedDB.deleteDatabase('historia-test-db');
        } catch (e) {
        }
        resolve(true);
      };
    });
  } catch (error) {
    return false;
  }
}

export function checkLocalStorageAvailability(): boolean {
  try {
    const testKey = 'historia-test-local-storage';
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey) === 'test';
    localStorage.removeItem(testKey);
    return result;
  } catch (error) {
    return false;
  }
}

export async function initStorage(): Promise<StorageState> {
  try {
    const indexedDBAvailable = await checkIndexedDBAvailability();
    
    if (indexedDBAvailable) {
      try {
        await initDatabase();
        currentStorageState = StorageState.AVAILABLE;
        console.log('Storage initialized in optimal mode: IndexedDB available');
        return StorageState.AVAILABLE;
      } catch (error) {
        console.warn('IndexedDB initialization failed, falling back to localStorage:', error);
      }
    }
    
    const localStorageAvailable = checkLocalStorageAvailability();
    
    if (localStorageAvailable) {
      currentStorageState = StorageState.DEGRADED;
      console.warn('Storage initialized in degraded mode: Using localStorage');
      return StorageState.DEGRADED;
    }
    
    currentStorageState = StorageState.UNAVAILABLE;
    console.error('No storage available: Application will run with limited functionality');
    
    showStorageWarning();
    
    return StorageState.UNAVAILABLE;
  } catch (error) {
    currentStorageState = StorageState.UNAVAILABLE;
    console.error('Error initializing storage:', error);
    return StorageState.UNAVAILABLE;
  }
}

function showStorageWarning() {
  const warningElement = document.createElement('div');
  warningElement.style.position = 'fixed';
  warningElement.style.top = '10px';
  warningElement.style.left = '50%';
  warningElement.style.transform = 'translateX(-50%)';
  warningElement.style.backgroundColor = '#ff5555';
  warningElement.style.color = 'white';
  warningElement.style.padding = '10px 20px';
  warningElement.style.borderRadius = '4px';
  warningElement.style.zIndex = '9999';
  warningElement.style.textAlign = 'center';
  warningElement.style.maxWidth = '90%';
  warningElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  
  if (currentStorageState === StorageState.DEGRADED) {
    warningElement.textContent = 'Limited storage available. Your work won\'t persist across browser sessions.';
  } else {
    warningElement.textContent = 'Storage unavailable. Your changes won\'t be saved. Try a different browser.';
  }
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.marginLeft = '10px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => document.body.removeChild(warningElement);
  
  warningElement.appendChild(closeButton);
  
  document.body.appendChild(warningElement);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getStorageState(): StorageState {
  return currentStorageState;
}

async function retryOperation<T>(
  operation: () => Promise<T>, 
  maxRetries: number = MAX_RETRIES, 
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed, attempt ${attempt + 1}/${maxRetries}:`, error);
      
      if (attempt < maxRetries - 1) {
        await sleep(delay * Math.pow(2, attempt));
      }
    }
  }
  
  throw lastError;
}

export async function getValue<T>(storeName: string, key: string): Promise<T | null> {
  try {
    if (currentStorageState === StorageState.AVAILABLE) {
      try {
        return await retryOperation(() => getValueFromDB<T>(storeName, key));
      } catch (error) {
        console.warn(`IndexedDB read failed for ${storeName}/${key}, trying localStorage:`, error);
      }
    }
    
    if (currentStorageState === StorageState.DEGRADED) {
      const localStorageKey = `historia-${storeName}-${key}`;
      const storedValue = localStorage.getItem(localStorageKey);
      
      if (storedValue) {
        try {
          return JSON.parse(storedValue) as T;
        } catch (parseError) {
          return storedValue as unknown as T;
        }
      }
      return null;
    }
    
    throw createStorageError('Storage is unavailable', StorageErrorType.READ);
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'StorageError') {
      throw error;
    }
    
    throw createStorageError(
      `Failed to read from ${storeName}/${key}`, 
      StorageErrorType.READ, 
      error
    );
  }
}

export async function setValue<T>(storeName: string, key: string, value: T): Promise<void> {
  try {
    if (currentStorageState === StorageState.AVAILABLE) {
      try {
        await retryOperation(() => setValueToDB<T>(storeName, key, value));
        return;
      } catch (error) {
        if (
          error instanceof DOMException && 
          (error.name === 'QuotaExceededError' || error.code === 22)
        ) {
          throw createStorageError(
            'Storage quota exceeded. Try removing some files.', 
            StorageErrorType.QUOTA_EXCEEDED, 
            error
          );
        }
        
        console.warn(`IndexedDB write failed for ${storeName}/${key}, trying localStorage:`, error);
      }
    }
    
    if (currentStorageState === StorageState.DEGRADED) {
      try {
        const localStorageKey = `historia-${storeName}-${key}`;
        const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
        
        localStorage.setItem(localStorageKey, valueToStore);
        return;
      } catch (localStorageError) {
        if (
          localStorageError instanceof DOMException && 
          (
            localStorageError.name === 'QuotaExceededError' || 
            localStorageError.code === 22
          )
        ) {
          throw createStorageError(
            'Storage quota exceeded. Try removing some files.', 
            StorageErrorType.QUOTA_EXCEEDED, 
            localStorageError
          );
        }
        
        throw createStorageError(
          `Failed to write to localStorage for ${storeName}/${key}`, 
          StorageErrorType.WRITE, 
          localStorageError
        );
      }
    }
    
    throw createStorageError('Storage is unavailable', StorageErrorType.WRITE);
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'StorageError') {
      throw error;
    }
    
    throw createStorageError(
      `Failed to write to ${storeName}/${key}`, 
      StorageErrorType.WRITE, 
      error
    );
  }
}

export async function deleteValue(storeName: string, key: string): Promise<void> {
  try {
    if (currentStorageState === StorageState.AVAILABLE) {
      try {
        await retryOperation(() => deleteValueFromDB(storeName, key));
        return;
      } catch (error) {
        console.warn(`IndexedDB delete failed for ${storeName}/${key}, trying localStorage:`, error);
      }
    }
    
    if (currentStorageState === StorageState.DEGRADED) {
      const localStorageKey = `historia-${storeName}-${key}`;
      localStorage.removeItem(localStorageKey);
      return;
    }
    throw createStorageError('Storage is unavailable', StorageErrorType.DELETE);
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'StorageError') {
      throw error;
    }
    
    throw createStorageError(
      `Failed to delete from ${storeName}/${key}`, 
      StorageErrorType.DELETE, 
      error
    );
  }
}

export async function getAllValues<T>(storeName: string): Promise<T[]> {
  try {
    if (currentStorageState === StorageState.AVAILABLE) {
      try {
        return await retryOperation(() => getAllValuesFromDB<T>(storeName));
      } catch (error) {
        console.warn(`IndexedDB getAll failed for ${storeName}, trying localStorage:`, error);
      }
    }
    
    if (currentStorageState === StorageState.DEGRADED) {
      const prefix = `historia-${storeName}-`;
      const results: T[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(prefix)) {
          const storedValue = localStorage.getItem(key);
          
          if (storedValue) {
            try {
              results.push(JSON.parse(storedValue) as T);
            } catch (parseError) {
              console.warn(`Failed to parse localStorage value for ${key}:`, parseError);
            }
          }
        }
      }
      
      return results;
    }
    
    throw createStorageError('Storage is unavailable', StorageErrorType.READ);
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'StorageError') {
      throw error;
    }
    
    throw createStorageError(
      `Failed to read all values from ${storeName}`, 
      StorageErrorType.READ, 
      error
    );
  }
}

export async function clearStore(storeName: string): Promise<void> {
  try {
    if (currentStorageState === StorageState.AVAILABLE) {
      try {
        await retryOperation(() => clearStoreFromDB(storeName));
        return;
      } catch (error) {
        console.warn(`IndexedDB clear failed for ${storeName}, trying localStorage:`, error);
      }
    }
    
    if (currentStorageState === StorageState.DEGRADED) {
      const prefix = `historia-${storeName}-`;
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      }
      
      return;
    }
    
    throw createStorageError('Storage is unavailable', StorageErrorType.DELETE);
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'StorageError') {
      throw error;
    }
    
    throw createStorageError(
      `Failed to clear store ${storeName}`, 
      StorageErrorType.DELETE, 
      error
    );
  }
}

/**
 * Handles storage errors and shows user-friendly messages based on error type.
 * @param {any} error - The error object
 * @param {any} [fallbackValue=null] - Value to return if an error occurs
 * @returns {any}
 */
export function handleStorageError(error: any, fallbackValue: any = null): any {
  if (error && typeof error === 'object' && 'name' in error && error.name === 'StorageError') {
    console.error(`Storage error (${error.type}):`, error.message, error.originalError);
    
    switch (error.type) {
      case StorageErrorType.QUOTA_EXCEEDED:
        showUserMessage('Storage space is full. Try deleting some files to continue.');
        break;
      case StorageErrorType.PERMISSION_DENIED:
        showUserMessage('Storage access denied. Check your browser permissions.');
        break;
      case StorageErrorType.WRITE:
        showUserMessage('Failed to save your changes. Please try again.');
        break;
      case StorageErrorType.READ:
        showUserMessage('Failed to load your data. Some content may be missing.');
        break;
      case StorageErrorType.DELETE:
        showUserMessage('Failed to delete content. Please try again.');
        break;
      default:
        showUserMessage('A storage error occurred. Some features may not work correctly.');
    }
  } else {
    console.error('Unknown storage error:', error);
    showUserMessage('An unexpected error occurred with storage.');
  }
  return fallbackValue;
}

/**
 * Displays a temporary user message in the UI, styled as a toast notification.
 * @param {string} message
 */
function showUserMessage(message: string) {
  const messageElement = document.createElement('div');
  messageElement.style.position = 'fixed';
  messageElement.style.bottom = '20px';
  messageElement.style.right = '20px';
  messageElement.style.backgroundColor = '#333';
  messageElement.style.color = 'white';
  messageElement.style.padding = '10px 20px';
  messageElement.style.borderRadius = '4px';
  messageElement.style.zIndex = '9999';
  messageElement.style.maxWidth = '300px';
  messageElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  messageElement.textContent = message;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.marginLeft = '10px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => document.body.removeChild(messageElement);
  
  messageElement.appendChild(closeButton);
  
  setTimeout(() => {
    if (document.body.contains(messageElement)) {
      document.body.removeChild(messageElement);
    }
  }, 5000);
  
  document.body.appendChild(messageElement);
}

export { DB_NAME, DB_VERSION, STORES };
