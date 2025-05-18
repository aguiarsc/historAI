import { useState, useCallback, useRef } from 'react'
import { FaFolder, FaFolderOpen, FaFile, FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import type { FileItemProps, DragItemData } from '../types'
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
  autoRenameId,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  isDragging = false,
  isDropTarget = false
}: FileItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoRenameId === id && !isEditing) {
      setIsEditing(true)
      setEditName(name)
    }
  }, [autoRenameId, id, isEditing, name])
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'file') {
        inputRef.current.setSelectionRange(0, 0)
      }
    }
  }, [isEditing, type])

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

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    const dragData: DragItemData = { id, type, parentId: null }
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (type === 'folder') {
      e.dataTransfer.dropEffect = 'move'
      onDragOver?.(id)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const dragData: DragItemData = JSON.parse(e.dataTransfer.getData('application/json'))
      if (dragData.id !== id && type === 'folder') {
        onDrop?.(dragData.id, id)
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  return (
    <li 
      className={`tree-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
      style={{ paddingLeft: `${level * 0.8}rem` }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={handleDragOver}
      onDragLeave={() => onDragLeave?.()}
      onDrop={handleDrop}
    >
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
              ref={inputRef}
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                background: 'var(--color-bg-panel)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '2px 4px'
              }}
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