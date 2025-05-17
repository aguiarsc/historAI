import type { TablePosition } from './types'

/**
 * Gets the current selection range in a textarea.
 * @param {HTMLTextAreaElement} el
 * @returns {[number, number]} Selection start and end.
 */
export const getSelection = (el: HTMLTextAreaElement): [number, number] => [
  el.selectionStart,
  el.selectionEnd
]

/**
 * Finds the markdown table at the current cursor position.
 * @param {string} text
 * @param {number} pos
 * @returns {TablePosition | null}
 */
export const findTableAtCursor = (text: string, pos: number): TablePosition | null => {
  const lines = text.split('\n')
  let currentPos = 0
  
  for (let row = 0; row < lines.length; row++) {
    const line = lines[row]
    const lineStart = currentPos
    currentPos += line.length + 1

    if (line.includes('|') && pos >= lineStart && pos <= currentPos) {
      const cells = line.split('|').filter(Boolean)
      let colPos = lineStart
      
      for (let col = 0; col < cells.length; col++) {
        const cellEnd = colPos + cells[col].length + 1
        if (pos >= colPos && pos <= cellEnd) {
          return { row, col, start: lineStart, end: currentPos - 1 }
        }
        colPos = cellEnd + 1
      }
    }
  }
  return null
}

/**
 * Inserts a table row above or below the current row.
 * @param {string} text
 * @param {TablePosition | null} tablePosition
 * @param {boolean} [above=false]
 * @returns {string}
 */
export const insertTableRow = (text: string, tablePosition: TablePosition | null, above: boolean = false): string => {
  if (!tablePosition) return text

  const lines = text.split('\n')
  const tableRow = lines[tablePosition.row]
  const colCount = tableRow.split('|').filter(Boolean).length
  const newRow = '|' + ' '.repeat(3) + '|'.repeat(colCount - 1)
  
  const insertIndex = above ? tablePosition.row : tablePosition.row + 1
  if (insertIndex === 1) return text

  const newLines = [...lines]
  newLines.splice(insertIndex, 0, newRow)
  return newLines.join('\n')
}

/**
 * Deletes the current row from a markdown table.
 * @param {string} text
 * @param {TablePosition | null} tablePosition
 * @returns {string}
 */
export const deleteTableRow = (text: string, tablePosition: TablePosition | null): string => {
  if (!tablePosition || tablePosition.row === 0) return text

  const lines = text.split('\n')
  const newLines = lines.filter((_, i) => i !== tablePosition.row)
  return newLines.join('\n')
}

/**
 * Inserts a column into a markdown table.
 * @param {string} text
 * @param {TablePosition | null} tablePosition
 * @param {boolean} [before=false]
 * @returns {string}
 */
export const insertTableColumn = (text: string, tablePosition: TablePosition | null, before: boolean = false): string => {
  if (!tablePosition) return text

  const lines = text.split('\n')
  const newLines = lines.map((line, i) => {
    if (!line.includes('|')) return line
    
    const cells = line.split('|').filter(Boolean)
    const insertIndex = before ? tablePosition.col : tablePosition.col + 1
    
    if (i === 1) {
      cells.splice(insertIndex, 0, '---')
    } else {
      cells.splice(insertIndex, 0, '   ')
    }
    
    return '|' + cells.join('|') + '|'
  })
  
  return newLines.join('\n')
}

/**
 * Deletes a column from a markdown table.
 * @param {string} text
 * @param {TablePosition | null} tablePosition
 * @returns {string}
 */
export const deleteTableColumn = (text: string, tablePosition: TablePosition | null): string => {
  if (!tablePosition) return text

  const lines = text.split('\n')
  const newLines = lines.map(line => {
    if (!line.includes('|')) return line
    
    const cells = line.split('|').filter(Boolean)
    cells.splice(tablePosition.col, 1)
    return '|' + cells.join('|') + '|'
  })
  
  return newLines.join('\n')
}

/**
 * Calculates word and character count for the given text.
 * @param {string} text
 * @returns {{ words: number, chars: number }}
 */
export const calculateWordCount = (text: string) => {
  const trimmedText = text.trim()
  const words = trimmedText ? trimmedText.split(/\s+/).length : 0
  const chars = trimmedText.length
  return { words, chars }
} 