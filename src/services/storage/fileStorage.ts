import { 
  STORES, 
  getValue, 
  setValue, 
  deleteValue,
  handleStorageError,
  getStorageState,
  StorageState
} from './storageManager';
import type { FileNode } from '../../features/fileManager/types';

/**
 * Key used for the root of the file tree in storage.
 */
export const FILE_TREE_KEY = 'root';
/**
 * Loads the file tree from persistent storage.
 * @returns {Promise<FileNode[]>}
 */
export const loadFileTree = async (): Promise<FileNode[]> => {
  try {
    const tree = await getValue<FileNode[]>(STORES.FILE_TREE, FILE_TREE_KEY);
    return tree || [];
  } catch (error) {
    console.error('Failed to load file tree:', error);
    return handleStorageError(error, []) as FileNode[];
  }
};

/**
 * Saves the file tree to persistent storage.
 * @param {FileNode[]} tree
 * @returns {Promise<boolean>}
 */
export const saveFileTree = async (tree: FileNode[]): Promise<boolean> => {
  try {
    await setValue(STORES.FILE_TREE, FILE_TREE_KEY, tree);
    return true;
  } catch (error) {
    console.error('Failed to save file tree:', error);
    handleStorageError(error);
    return false;
  }
};

/**
 * Loads the content of a file by its ID.
 * @param {string} fileId
 * @returns {Promise<string>}
 */
export const loadFileContent = async (fileId: string): Promise<string> => {
  try {
    console.log(`Loading file content for ${fileId}`);
    const content = await getValue<string>(STORES.FILE_CONTENTS, fileId);
    console.log(`Loaded content for ${fileId}, found: ${content !== null}`);
    return content || '';
  } catch (error) {
    console.error(`Failed to load content for file ${fileId}:`, error);
    return handleStorageError(error, '') as string;
  }
};

/**
 * Saves content to a file by its ID.
 * @param {string} fileId
 * @param {string} content
 * @returns {Promise<boolean>}
 */
export const saveFileContent = async (fileId: string, content: string): Promise<boolean> => {
  try {
    console.log(`Saving file content for ${fileId}, length: ${content.length}`);
    await setValue(STORES.FILE_CONTENTS, fileId, content);
    return true;
  } catch (error) {
    console.error(`Failed to save content for file ${fileId}:`, error);
    handleStorageError(error);
    return false;
  }
};

/**
 * Deletes a file's content by its ID.
 * @param {string} fileId
 * @returns {Promise<boolean>}
 */
export const deleteFileContent = async (fileId: string): Promise<boolean> => {
  try {
    await deleteValue(STORES.FILE_CONTENTS, fileId);
    return true;
  } catch (error) {
    console.error(`Failed to delete content for file ${fileId}:`, error);
    handleStorageError(error);
    return false;
  }
};

/**
 * Checks if storage is available.
 * @returns {boolean}
 */
export const isStorageAvailable = (): boolean => {
  const state = getStorageState();
  return state !== StorageState.UNAVAILABLE;
};

/**
 * Checks if optimal (IndexedDB) storage is available.
 * @returns {boolean}
 */
export const isOptimalStorageAvailable = (): boolean => {
  return getStorageState() === StorageState.AVAILABLE;
};

/**
 * Returns a human-readable description of storage state.
 * @returns {string}
 */
export const getStorageStateDescription = (): string => {
  const state = getStorageState();
  
  switch (state) {
    case StorageState.AVAILABLE:
      return 'Full storage capabilities available (IndexedDB)';
    case StorageState.DEGRADED:
      return 'Limited storage available (localStorage only)';
    case StorageState.UNAVAILABLE:
      return 'No storage available - your changes won\'t be saved';
    default:
      return 'Unknown storage state';
  }
};
