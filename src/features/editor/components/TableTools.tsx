import { FaPlus, FaTrash } from 'react-icons/fa'
import type { TableToolsProps } from '../types'

export default function TableTools({ 
  position, 
  onInsertRow, 
  onDeleteRow, 
  onInsertColumn, 
  onDeleteColumn 
}: TableToolsProps) {
  if (!position) return null

  return (
    <div className="table-tools" style={{
      position: 'absolute',
      top: '100px', 
      left: '100px' 
    }}>
      <button onClick={() => onInsertRow(true)} title="Insert row above">
        <FaPlus style={{ transform: 'rotate(90deg)' }} />
      </button>
      <button onClick={() => onInsertRow(false)} title="Insert row below">
        <FaPlus style={{ transform: 'rotate(-90deg)' }} />
      </button>
      <button onClick={() => onInsertColumn(true)} title="Insert column before">
        <FaPlus />
      </button>
      <button onClick={() => onInsertColumn(false)} title="Insert column after">
        <FaPlus style={{ transform: 'rotate(180deg)' }} />
      </button>
      <button onClick={onDeleteRow} title="Delete row">
        <FaTrash style={{ transform: 'rotate(90deg)' }} />
      </button>
      <button onClick={onDeleteColumn} title="Delete column">
        <FaTrash />
      </button>
    </div>
  )
} 