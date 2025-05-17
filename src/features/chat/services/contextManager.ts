import { loadTree } from '../../fileManager/utils';
import { loadFileContent } from '../../../services/storage/fileStorage';
import type { FileNode } from '../../fileManager/types';

/**
 * Reference to a file or directory for context extraction.
 */
export interface ContextReference {
  path: string;
  type: 'file' | 'directory';
  resolved: boolean;
}

/**
 * Result of collecting context from references.
 */
export interface CollectedContext {
  references: ContextReference[];
  content: string;
}

/**
 * Parses @-style context references from a command string.
 * @param {string} commandText - Input string with @references.
 * @returns {ContextReference[]} Array of references.
 */
export function parseContextReferences(commandText: string): ContextReference[] {
  const references: ContextReference[] = [];
  
  const contextRegex = /@([\w\-\./]+)/g;
  let match;
  
  while ((match = contextRegex.exec(commandText)) !== null) {
    const path = match[1];
    
    if (!path.trim()) continue;
    
    const type = path.endsWith('/') ? 'directory' : 'file';
    
    const alreadyExists = references.some(ref => ref.path === path);
    if (!alreadyExists) {
      references.push({
        path,
        type,
        resolved: false
      });
    }
  }
  
  console.log('Parsed context references:', references);
  return references;
}

/**
 * Finds a node in the file tree by its path.
 * @param {FileNode[]} tree
 * @param {string} path
 * @returns {FileNode | null}
 */
export function findNodeByPath(tree: FileNode[], path: string): FileNode | null {
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  
  if (!normalizedPath || normalizedPath === '/' || normalizedPath === 'root') {
    return {
      id: 'root',
      name: 'root',
      type: 'folder',
      children: tree,
      parentId: null
    };
  }
  
  const segments = normalizedPath.split('/').filter(p => p && p !== 'root');
  
  let currentNodes = tree;
  let currentNode: FileNode | null = null;
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLastSegment = i === segments.length - 1;
    
    if (isLastSegment) {
      currentNode = currentNodes.find(node => 
        node.name === segment
      ) || null;
    } else {
      const folderNode = currentNodes.find(node => 
        node.type === 'folder' && node.name === segment
      );
      
      if (folderNode) {
        currentNodes = folderNode.children || [];
      } else {
        return null;
      }
    }
  }
  
  return currentNode;
}

async function collectFileContent(fileNode: FileNode): Promise<string> {
  const content = await loadFileContent(fileNode.id);
  const fileName = fileNode.name;
  
  return `## ${fileName}\n\n${content}\n\n`;
}

async function collectDirectoryContent(dirNode: FileNode): Promise<string> {
  if (!dirNode.children || dirNode.children.length === 0) {
    return `## ${dirNode.name} (empty directory)\n\n`;
  }
  
  const fileNodes = dirNode.children.filter(node => node.type === 'file');
  
  if (fileNodes.length === 0) {
    return `## ${dirNode.name} (no files)\n\n`;
  }
  
  let content = `## Directory: ${dirNode.name}\n\n`;
  
  for (const fileNode of fileNodes) {
    content += `### File: ${fileNode.name}\n\n`;
    content += await loadFileContent(fileNode.id);
    content += '\n\n';
  }
  
  return content;
}

/**
 * Collects context content for the given references.
 * @param {ContextReference[]} references
 * @returns {Promise<CollectedContext>} Collected context.
 */
export async function collectContext(references: ContextReference[]): Promise<CollectedContext> {
  const tree = await loadTree();
  let content = '';
  
  for (const reference of references) {
    const node = findNodeByPath(tree, reference.path);
    
    if (node) {
      reference.resolved = true;
      
      if (node.type === 'file') {
        content += await collectFileContent(node);
      } else if (node.type === 'folder') {
        content += await collectDirectoryContent(node);
      }
    }
  }
  
  if (references.length > 0 && !content.trim()) {
    content = "No content found from the specified context references.\n\n";
  }
  
  return {
    references,
    content: content.trim()
  };
}

/**
 * Formats a summary of the context extraction results.
 * @param {CollectedContext} context
 * @returns {string} Summary string.
 */
export function formatContextSummary(context: CollectedContext): string {
  if (context.references.length === 0) {
    return '';
  }
  
  const successfulRefs = context.references.filter(ref => ref.resolved);
  const failedRefs = context.references.filter(ref => !ref.resolved);
  
  let summary = '**Context Summary**\n\n';
  
  if (successfulRefs.length > 0) {
    summary += 'Successfully loaded context from:\n';
    for (const ref of successfulRefs) {
      summary += `- ${ref.path} (${ref.type})\n`;
    }
  }
  
  if (failedRefs.length > 0) {
    summary += '\nFailed to load context from:\n';
    for (const ref of failedRefs) {
      summary += `- ${ref.path} (${ref.type})\n`;
    }
  }
  
  return summary;
}
