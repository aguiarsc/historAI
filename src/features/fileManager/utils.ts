import type { FileNode } from './types'
import { DEFAULT_TREE, FILE_SYSTEM_CHANGED_EVENT } from './constants'
import { loadFileTree as dbLoadTree, saveFileTree as dbSaveTree, loadFileContent, saveFileContent, deleteFileContent } from '../../services/storage/fileStorage'

/**
 * Generates a random ID for new files or folders.
 * @returns {string}
 */
export const generateId = () => '_' + Math.random().toString(36).slice(2, 10)

/**
 * Loads the file tree structure from storage.
 * @returns {Promise<FileNode[]>}
 */
export const loadTree = async (): Promise<FileNode[]> => {
  try {
    const tree = await dbLoadTree()
    return tree.length > 0 ? tree : DEFAULT_TREE as FileNode[]
  } catch (error) {
    console.error('Error loading file tree:', error)
    return DEFAULT_TREE as FileNode[]
  }
}

/**
 * Synchronously loads the default file tree (deprecated).
 * @returns {FileNode[]}
 */
export const loadTreeSync = (): FileNode[] => {
  console.warn('loadTreeSync is deprecated - use async loadTree instead')
  return DEFAULT_TREE as FileNode[]
}
/**
 * Saves the file tree structure to storage.
 * @param {FileNode[]} tree
 * @returns {Promise<void>}
 */
export const saveTree = async (tree: FileNode[]): Promise<void> => {
  try {
    await dbSaveTree(tree)
  } catch (error) {
    console.error('Error saving file tree:', error)
  }
}

/**
 * Emits a custom event when the file system changes.
 */
export function emitFileSystemChanged(): void {
  window.dispatchEvent(new CustomEvent(FILE_SYSTEM_CHANGED_EVENT))
}

/**
 * Loads file content by file ID.
 * @param {string} fileId
 * @returns {Promise<string>}
 */
export const loadFileContentById = async (fileId: string): Promise<string> => {
  try {
    return await loadFileContent(fileId)
  } catch (error) {
    console.error(`Error loading content for file ${fileId}:`, error)
    return ''
  }
}

/**
 * Saves file content by file ID.
 * @param {string} fileId
 * @param {string} content
 * @returns {Promise<void>}
 */
export const saveFileContentById = async (fileId: string, content: string): Promise<void> => {
  try {
    await saveFileContent(fileId, content)
    emitFileSystemChanged()
  } catch (error) {
    console.error(`Error saving content for file ${fileId}:`, error)
  }
}

/**
 * Deletes file content by file ID.
 * @param {string} fileId
 * @returns {Promise<void>}
 */
export const deleteFileContentById = async (fileId: string): Promise<void> => {
  try {
    await deleteFileContent(fileId)
  } catch (error) {
    console.error(`Error deleting content for file ${fileId}:`, error)
  }
}