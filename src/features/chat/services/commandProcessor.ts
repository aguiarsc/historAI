import { loadTree, saveTree, generateId, emitFileSystemChanged } from '../../fileManager/utils';
import { loadFileContent, saveFileContent } from '../../../services/storage/fileStorage';
import type { FileNode } from '../../fileManager/types';
import { sendToGemini } from './api';
import { parseContextReferences, collectContext, formatContextSummary } from './contextManager';
import { cleanFileContent } from './responseProcessor';

/**
 * The type of command that can be executed (create or edit).
 */
export type CommandType = 'create' | 'edit';
/**
 * The editing option for file commands (extend or overwrite).
 */
export type EditOption = 'extend' | 'overwrite';

/**
 * Arguments for a command, including file name, location, prompt, option, and context references.
 */
export interface CommandArgs {
  name?: string;
  location?: string;
  prompt?: string;
  option?: EditOption;
  contexts?: string[];
}

/**
 * The result of running a command, including success, message, and the affected file node.
 */
export interface CommandResult {
  success: boolean;
  message: string;
  node?: FileNode;
}

/**
 * Parses a command string and extracts the command type and arguments.
 * @param {string} commandText - The command input string.
 * @returns {{ type: CommandType; args: CommandArgs } | null} The parsed command or null if invalid.
 */
export function parseCommand(commandText: string): { type: CommandType; args: CommandArgs } | null {
  const contextReferences = parseContextReferences(commandText);
  
  let cleanedCommandText = commandText;
  for (const ref of contextReferences) {
    cleanedCommandText = cleanedCommandText.replace('@' + ref.path, '').trim();
  }
  
  cleanedCommandText = cleanedCommandText.trim().replace(/\s+/g, ' ');
  
  const createCommandRegex = /\bcreate\s+--/;
  const editCommandRegex = /\bedit\s+--/;
  
  if (!createCommandRegex.test(cleanedCommandText) && !editCommandRegex.test(cleanedCommandText)) {
    return null;
  }

  const type = createCommandRegex.test(cleanedCommandText) ? 'create' : 'edit';
  
  let argsText = cleanedCommandText.replace(/^\s*(create|edit)\s+/, '');
  
  const args: CommandArgs = {};
  
  if (contextReferences.length > 0) {
    args.contexts = contextReferences.map(ref => ref.path);
  }
  
  const argRegex = /--([a-zA-Z]+)="((?:\\.|[^"\\])*?)"/g;
  
  let match;
  while ((match = argRegex.exec(argsText)) !== null) {
    const key = match[1];
    const value = match[2].replace(/\\"/g, '"');
    
    switch (key) {
      case 'name':
      case 'location':
      case 'prompt':
        args[key] = value;
        break;
      case 'option':
        if (value === 'extend') {
          args.option = 'extend';
        } else if (value === 'overwrite') {
          args.option = 'overwrite';
        }
        break;
    }
  }

  return { type, args };
}

function findDirectoryNode(tree: FileNode[], path: string, createMissing: boolean = false): FileNode | null {
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
  let currentNode: FileNode = {
    id: 'root',
    name: 'root',
    type: 'folder',
    children: tree,
    parentId: null
  };
  
  for (const segment of segments) {
    const foundNode = currentNodes.find(node => 
      node.type === 'folder' && node.name === segment
    );
    
    if (foundNode) {
      currentNode = foundNode;
      currentNodes = foundNode.children || [];
    } else if (createMissing) {
      const newDir: FileNode = {
        id: generateId(),
        name: segment,
        type: 'folder',
        children: [],
        parentId: currentNode.id
      };
      
      if (!currentNode.children) {
        currentNode.children = [];
      }
      currentNode.children.push(newDir);
      
      currentNode = newDir;
      currentNodes = newDir.children || [];
    } else {
      return null;
    }
  }
  
  return currentNode;
}
/**
 * Creates a new file at the specified location with AI-generated content.
 * @param {string} name - The file name.
 * @param {string} location - The directory path.
 * @param {string} prompt - The prompt for content generation.
 * @param {string} apiKey - The Gemini API key.
 * @returns {Promise<CommandResult>} The result of the file creation.
 */
export async function createFile(name: string, location: string, prompt: string, apiKey: string): Promise<CommandResult> {
  try {
    const tree = await loadTree();
    
    const dirPath = location.endsWith('/') ? location.slice(0, -1) : location;
    const dirNode = findDirectoryNode(tree, dirPath, true);
    
    if (!dirNode) {
      return {
        success: false,
        message: `Error: Could not create directory path "${dirPath}".`
      };
    }
    
    await saveTree(tree);
    
    const fileExists = dirNode.children?.some(
      child => child.type === 'file' && child.name === name
    );
    
    if (fileExists) {
      return {
        success: false,
        message: `Error: File "${name}" already exists in "${dirPath}".`
      };
    }
    
    let content: string;
    try {
      content = await sendToGemini(prompt, apiKey, false);
      
      if (content.includes('API error') || content.includes('API key')) {
        return {
          success: false,
          message: `Error generating content: ${content}`
        };
      }
      
      content = cleanFileContent(content);
    } catch (error) {
      return {
        success: false,
        message: `Error generating content with AI: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    const newFile: FileNode = {
      id: generateId(),
      name: name.endsWith('.md') ? name : `${name}.md`,
      type: 'file',
      parentId: dirNode.id
    };
    
    if (!dirNode.children) {
      dirNode.children = [];
    }
    dirNode.children.push(newFile);
    
    await saveTree(tree);
    
    const fileContent = cleanFileContent(content);
    try {
      await saveFileContent(newFile.id, fileContent);
      console.log(`File content saved successfully for ${newFile.id}, size: ${fileContent.length}`);
    } catch (error) {
      console.error(`Error saving file content for ${newFile.id}:`, error);
      return {
        success: false,
        message: `Error saving file content: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    emitFileSystemChanged();
    
    return {
      success: true,
      message: `✅ Created file "${newFile.name}" in "${dirPath}" with generated content.`,
      node: newFile
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function findFileNode(tree: FileNode[], path: string, fileName: string, createPath: boolean = false): { fileNode: FileNode | null, parentNode: FileNode | null } {
  const dirPath = path.endsWith('/') ? path.slice(0, -1) : path;
  const dirNode = findDirectoryNode(tree, dirPath, createPath);
  
  if (!dirNode) {
    return { fileNode: null, parentNode: null };
  }
  
  const fileNode = dirNode.children?.find(
    child => child.type === 'file' && 
    (child.name === fileName || child.name === `${fileName}.md`)
  ) || null;
  
  return { fileNode, parentNode: dirNode };
}

/**
 * Edits an existing file by extending or overwriting its content using AI.
 * @param {string} name - The file name.
 * @param {string} location - The directory path.
 * @param {string} prompt - The prompt for content generation.
 * @param {EditOption} option - The editing option (extend or overwrite).
 * @param {string} apiKey - The Gemini API key.
 * @returns {Promise<CommandResult>} The result of the file edit.
 */
export async function editFile(
  name: string, 
  location: string, 
  prompt: string, 
  option: EditOption = 'extend',
  apiKey: string
): Promise<CommandResult> {
  try {
    const tree = await loadTree();
    
    const sanitizedName = name.endsWith('.md') ? name : `${name}.md`;
    const { fileNode } = findFileNode(tree, location, sanitizedName, true);
    
    await saveTree(tree);
    
    if (!fileNode) {
      return {
        success: false,
        message: `Error: File "${sanitizedName}" not found in "${location}". Use 'create' command first.`
      };
    }
    
    let existingContent = '';
    let newContent = '';
    
    if (option === 'extend') {
      existingContent = await loadFileContent(fileNode.id);
      newContent = existingContent + '\n\n' + prompt;
    } else {
      newContent = prompt;
    }
    
    let aiResponse: string;
    try {
      aiResponse = await sendToGemini(newContent, apiKey, false);
      
      if (aiResponse.includes('API error') || aiResponse.includes('API key')) {
        return {
          success: false,
          message: `Error generating content: ${aiResponse}`
        };
      }
      
      aiResponse = cleanFileContent(aiResponse);
    } catch (error) {
      return {
        success: false,
        message: `Error generating content with AI: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    if (option === 'extend') {
      newContent = existingContent + '\n\n' + aiResponse;
    } else {
      newContent = aiResponse;
    }
    
    await saveFileContent(fileNode.id, newContent);
    emitFileSystemChanged();
    
    return {
      success: true,
      message: `✅ ${option === 'extend' ? 'Extended' : 'Overwrote'} file "${sanitizedName}" in "${location}" with generated content.`,
      node: fileNode
    };
  } catch (error) {
    return {
      success: false,
      message: `Error editing file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Executes a command (create or edit) with the given arguments and API key.
 * @param {CommandType} type - The type of command to execute.
 * @param {CommandArgs} args - The arguments for the command.
 * @param {string} apiKey - The Gemini API key.
 * @returns {Promise<CommandResult>} The result of the command execution.
 */
export async function executeCommand(
  type: CommandType, 
  args: CommandArgs,
  apiKey: string
): Promise<CommandResult> {
  if (!args.name) {
    return { success: false, message: 'Error: Missing required argument "name".' };
  }
  
  if (!args.location) {
    return { success: false, message: 'Error: Missing required argument "location".' };
  }
  
  if (!args.prompt) {
    return { success: false, message: 'Error: Missing required argument "prompt".' };
  }
  
  if (!apiKey) {
    return { success: false, message: 'Error: Gemini API key not set. Please set your API key first.' };
  }
  
  let contextContent = '';
  let contextSummary = '';
  
  if (args.contexts && args.contexts.length > 0) {
    const contextReferences = args.contexts.map(path => ({
      path,
      type: path.endsWith('/') ? 'directory' as const : 'file' as const,
      resolved: false
    }));
    
    const collectedContext = await collectContext(contextReferences);
    
    contextSummary = formatContextSummary(collectedContext);
    contextContent = collectedContext.content;
    
    if (contextContent) {
      args.prompt = `Context information:\n\n${contextContent}\n\nUser request:\n${args.prompt}`;
    }
  }
  
  let result: CommandResult;
  
  switch (type) {
    case 'create':
      result = await createFile(args.name, args.location, args.prompt, apiKey);
      break;
      
    case 'edit':
      if (args.option !== 'extend' && args.option !== 'overwrite') {
        args.option = 'extend' as const;
      }
      result = await editFile(args.name, args.location, args.prompt, args.option, apiKey);
      break;
      
    default:
      return { success: false, message: `Error: Unknown command type "${type}".` };
  }
  
  if (contextSummary && result.success) {
    result.message = `${result.message}\n\n${contextSummary}`;
  }
  
  return result;
}

/**
 * Returns help text for available Gemini file management commands.
 * @returns {string} The help documentation as markdown.
 */
export function getCommandHelp(): string {
  return `
# Gemini File Management Commands

## Create a new file
\`\`\`
create --name="filename" --location="path/to/directory/" --prompt="AI prompt to generate content"
\`\`\`

## Edit (extend) existing file
\`\`\`
edit --name="filename" --location="path/to/directory/" --prompt="AI prompt for new content" --option="extend"
\`\`\`

## Edit (overwrite) existing file
\`\`\`
edit --name="filename" --location="path/to/directory/" --prompt="AI prompt for new content" --option="overwrite"
\`\`\`

## Using Context References

You can provide context from existing files and directories to improve AI responses:

\`\`\`
@root/creatures/
@root/ideas/
@root/script.md

create --name="chapterOne" --location="root/chapters/" --prompt="With all that context, create the first chapter of my novel"
\`\`\`

### Notes:
- File extension ".md" will be added automatically if not provided
- Location should be the path to the directory (e.g., "root/notes/")
- Prompt is the instruction for Gemini to generate content
- Context references (@path/to/file) provide additional information to Gemini
- Directory references (@path/to/directory/) include all files in that directory
  `;
}
