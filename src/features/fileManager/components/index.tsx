import React, { useState, useCallback, useEffect } from 'react'
import { FaFolder, FaFolderOpen, FaFile, FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import type { FileTreeProps, FileNode } from '../types'
import { FileItem } from './FileItem'
import { loadTree, saveTree, generateId, emitFileSystemChanged, loadFileContentById, saveFileContentById, deleteFileContentById } from '../utils'
import { DEFAULT_TREE } from '../constants'
import { FILE_SYSTEM_CHANGED_EVENT } from '../constants'
import '../styles/FileTree.css'

/**
 * Renders the file tree sidebar for browsing, adding, renaming, and deleting files/folders.
 * @param {FileTreeProps} props - File tree properties including selection and content handlers.
 */
export default function FileTree({ onSelect, selectedFile, setFileContent, fileContent }: FileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>(DEFAULT_TREE as FileNode[])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['personal']))
  const [isLoading, setIsLoading] = useState(true)
  const [autoRenameId, setAutoRenameId] = useState<string>('')
  const [showIcons] = useState<{[key: string]: React.ReactNode}>({
    folder: <FaFolder />,
    folderOpen: <FaFolderOpen />,
    file: <FaFile />,
    add: <FaPlus />,
    edit: <FaEdit />,
    delete: <FaTrash />
  })

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const fetchedTree = await loadTree()
        setTree(fetchedTree)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading file tree:', error)
        setIsLoading(false)
      }
    }
    
    fetchTree()
  }, [])
  
  useEffect(() => {
    const handleFileSystemChanged = async () => {
      try {
        const updatedTree = await loadTree()
        setTree(updatedTree)
      } catch (error) {
        console.error('Error handling file system change:', error)
      }
    }
    
    window.addEventListener(FILE_SYSTEM_CHANGED_EVENT, handleFileSystemChanged)
    return () => window.removeEventListener(FILE_SYSTEM_CHANGED_EVENT, handleFileSystemChanged)
  }, [])

  useEffect(() => {
    if (selectedFile) {
      const fetchContent = async () => {
        try {
          const content = await loadFileContentById(selectedFile)
          setFileContent(content)
        } catch (error) {
          console.error(`Error loading content for file ${selectedFile}:`, error)
          setFileContent('')
        }
      }
      
      fetchContent()
    }
  }, [selectedFile, setFileContent])

  const saveFileContent = useCallback(async (fileId: string, content: string) => {
    try {
      await saveFileContentById(fileId, content)
    } catch (error) {
      console.error(`Error saving content for file ${fileId}:`, error)
    }
  }, [])

  const updateTree = useCallback(async (newTree: FileNode[]) => {
    setTree(newTree)
    try {
      await saveTree(newTree)
      emitFileSystemChanged()
    } catch (error) {
      console.error('Error updating file tree:', error)
    }
  }, [])

  const toggleNode = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const findAndUpdateNode = useCallback((nodes: FileNode[], id: string, updater: (node: FileNode) => FileNode): FileNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return updater(node)
      }
      if (node.children) {
        return {
          ...node,
          children: findAndUpdateNode(node.children, id, updater)
        }
      }
      return node
    })
  }, [])

  const handleAdd = useCallback((parentId: string, type: 'file' | 'folder') => {
    const newNode: FileNode = {
      id: generateId(),
      name: type === 'file' ? '.md' : '',
      type,
      children: type === 'folder' ? [] : undefined,
      parentId
    }
    
    // Set auto-rename ID to trigger editing mode
    setAutoRenameId(newNode.id)

    updateTree(
      findAndUpdateNode(tree, parentId, node => ({
        ...node,
        children: [...(node.children || []), newNode]
      }))
    )

    if (type === 'file') {
      const emptyContent = ''
      saveFileContent(newNode.id, emptyContent)
      setFileContent(emptyContent)
      onSelect(newNode.id)
    } else {
      setExpandedNodes(prev => new Set([...prev, parentId]))
    }
  }, [tree, updateTree, onSelect, setFileContent, saveFileContent])
  
  const addRootLevel = useCallback((type: 'file' | 'folder') => {
    const newNode: FileNode = {
      id: generateId(),
      name: type === 'file' ? '.md' : '',
      type,
      children: type === 'folder' ? [] : undefined,
      parentId: null
    }
    
    setAutoRenameId(newNode.id)
    
    const newTree = [...tree, newNode]
    updateTree(newTree)
    
    if (type === 'file') {
      const emptyContent = ''
      saveFileContent(newNode.id, emptyContent)
      setFileContent(emptyContent)
      onSelect(newNode.id)
    } else {
      setExpandedNodes(prev => new Set([...prev, newNode.id]))
    }
  }, [tree, updateTree, onSelect, setFileContent, saveFileContent])

  const handleRename = useCallback((id: string, newName: string) => {
    updateTree(
      findAndUpdateNode(tree, id, node => ({
        ...node,
        name: newName
      }))
    )
    
    setAutoRenameId('')
  }, [tree, updateTree])

  const handleDelete = useCallback((id: string) => {
    const filterNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter(node => {
        if (node.id === id) {
          if (node.type === 'file') {
            deleteFileContentById(node.id).catch(error => {
              console.error(`Error deleting content for file ${node.id}:`, error)
            })
          }
          return false
        }
        if (node.children) {
          node.children = filterNodes(node.children)
        }
        return true
      })
    }

    updateTree(filterNodes(tree))
    if (selectedFile === id) {
      onSelect('')
      setFileContent('')
    }
  }, [tree, updateTree, selectedFile, onSelect, setFileContent])

  useEffect(() => {
    if (selectedFile && fileContent !== undefined) {
      const debouncedSave = setTimeout(() => {
        saveFileContent(selectedFile, fileContent).catch(error => {
          console.error(`Error saving content for file ${selectedFile}:`, error)
        })
      }, 500)
      return () => clearTimeout(debouncedSave)
    }
  }, [selectedFile, fileContent, saveFileContent])

  return (
    <nav className="filetree">
      <div className="filetree-header">
        <div className="filetree-title">Files</div>
        <div className="filetree-actions">
          <button 
            title="New File" 
            onClick={() => addRootLevel('file')}
            className="filetree-action-btn"
          >
            <FaFile size={14} /> <span>New File</span>
          </button>
          <button 
            title="New Folder" 
            onClick={() => addRootLevel('folder')}
            className="filetree-action-btn"
          >
            <FaFolder size={14} /> <span>New Folder</span>
          </button>
        </div>
        <span className="hidden-icons" style={{ display: 'none' }} 
          title={`Icons ready: ${Object.keys(showIcons).join(', ')}`} />
      </div>
      <div className="filetree-body">
        {isLoading ? (
          <div className="loading-indicator">Loading files...</div>
        ) : (
          <ul className="tree-root">
            {tree.map(node => (
              <FileItem
                key={node.id}
                {...node}
                expanded={expandedNodes.has(node.id)}
                onToggle={toggleNode}
                onSelect={onSelect}
                onAdd={handleAdd}
                onRename={handleRename}
                onDelete={handleDelete}
                isSelected={selectedFile === node.id}
                level={0}
                autoRenameId={autoRenameId}
              />
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
} 