/**
 * Represents a node in the file tree (file or folder).
 */
export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  parentId: string | null
}

/**
 * Props for the FileTree component, including selection and content handlers.
 */
export interface FileTreeProps {
  onSelect: (id: string) => void
  selectedFile: string | null
  setFileContent: (content: string) => void
  fileContent: string
}

/**
 * Props for the FileItem component, extending FileNode with UI and event handlers.
 */
export interface FileItemProps extends FileNode {
  expanded: boolean
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  onAdd: (parentId: string, type: 'file' | 'folder') => void
  onRename: (id: string, newName: string) => void
  onDelete: (id: string) => void
  isSelected: boolean
  level: number
  autoRenameId?: string
}