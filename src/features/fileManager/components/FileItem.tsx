import { useState, useCallback } from 'react'
import { FaFolder, FaFolderOpen, FaFile, FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import type { FileItemProps } from '../types'
import { useEffect } from 'react'

/**
 * Renders a file or folder item in the file tree with actions and nesting.
 * @param {FileItemProps} props
 */
export function FileItem({
  id,
  name,
  type,
  children,
  expanded,
  onToggle,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  isSelected,
  level,
  autoRenameId
}: FileItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  
  useEffect(() => {
    if (autoRenameId === id && !isEditing) {
      setIsEditing(true)
      if (type === 'file') {
        const dotIndex = name.lastIndexOf('.')
        if (dotIndex > 0) {
          setEditName(name)
        }
      }
    }
  }, [autoRenameId, id, isEditing, name, type])

  const handleRename = useCallback(() => {
    if (editName.trim() && editName !== name) {
      onRename(id, editName.trim())
    }
    setIsEditing(false)
  }, [editName, id, name, onRename])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditName(name)
    }
  }, [handleRename, name])

  return (
    <li className={`tree-item ${isSelected ? 'selected' : ''}`} style={{ paddingLeft: `${level * 0.8}rem` }}>
      <div className="item-content">
        <div
          className="item-label"
          onClick={() => type === 'folder' ? onToggle(id) : onSelect(id)}
        >
          {type === 'folder' ? (
            expanded ? <FaFolderOpen /> : <FaFolder />
          ) : (
            <FaFile />
          )}
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span>{name}</span>
          )}
        </div>
        <div className="item-actions">
          {type === 'folder' && (
            <>
              <button title="Add file" onClick={() => onAdd(id, 'file')}><FaPlus /></button>
              <button title="Add folder" onClick={() => onAdd(id, 'folder')}><FaPlus style={{ transform: 'rotate(45deg)' }} /></button>
            </>
          )}
          <button title="Rename" onClick={() => setIsEditing(true)}><FaEdit /></button>
          <button title="Delete" onClick={() => onDelete(id)}><FaTrash /></button>
        </div>
      </div>
      {type === 'folder' && expanded && children && children.length > 0 && (
        <ul className="tree-children">
          {children.map(child => (
            <FileItem
              key={child.id}
              {...child}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onAdd={onAdd}
              onRename={onRename}
              onDelete={onDelete}
              isSelected={isSelected}
              level={level + 1}
              autoRenameId={autoRenameId}
            />
          ))}
        </ul>
      )}
    </li>
  )
} 