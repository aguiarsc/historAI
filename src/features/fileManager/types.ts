/**
 * Represents a node in the file tree (file or folder).
 */
export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  parentId: string | null
  isDragging?: boolean
  isDropTarget?: boolean
}

/**
 * Data transferred during drag and drop operations
 */
export interface DragItemData {
  id: string
  type: 'file' | 'folder'
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
  onDrop?: (draggedId: string, targetId: string) => void
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
  onDragOver?: (id: string) => void
  onDragLeave?: () => void
  isSelected: boolean
  level: number
  autoRenameId?: string
  isDragging?: boolean
  isDropTarget?: boolean
}