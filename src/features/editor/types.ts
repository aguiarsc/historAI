export type EditorProps = {
  value: string
  onChange: (value: string) => void
  theme?: 'light' | 'dark'
  isReaderMode?: boolean
  isWriterMode?: boolean
  isSidebarVisible?: boolean
  isEfficientMode?: boolean
  isPureWriterMode?: boolean
  isFocusMode?: boolean
  toggleReaderMode?: () => void
  toggleWriterMode?: () => void
  toggleSidebar?: () => void
  toggleEfficientMode?: () => void
  togglePureWriterMode?: () => void
  toggleFocusMode?: () => void
  showToolbarOnly?: boolean
}

export interface ToolbarAction {
  icon: React.ReactNode
  title: string
  shortcut: string
  action: (text: string, selection: [number, number]) => string
}

export interface Pair {
  open: string
  close: string
}

export interface TablePosition {
  row: number
  col: number
  start: number
  end: number
}

export interface CheatSheetCategory {
  [key: string]: string
}

export interface CheatSheetData {
  [category: string]: CheatSheetCategory
}

export interface CodeLanguageSelectProps {
  isOpen: boolean
  onClose: () => void
  onSelectLanguage: (language: string) => void
}

export interface CheatSheetProps {
  isOpen: boolean
  onClose: () => void
  cheatSheetData: CheatSheetData
}

export interface FindReplaceOptions {
  matchCase: boolean
  matchWholeWord: boolean
  preserveCase: boolean
  useRegex?: boolean
}

export interface FindReplaceMatch {
  index: number
  length: number
  text: string
  selected: boolean
}

export interface FindReplaceProps {
  isOpen: boolean
  onClose: () => void
  onFindReplace: (findText: string, replaceText: string, replaceAll: boolean, options: FindReplaceOptions) => void
  onHighlightMatches: (matches: FindReplaceMatch[]) => void
  content: string
}

export interface LinkHelperProps {
  isOpen: boolean
  onClose: () => void
  onInsertLink: (text: string, url: string) => void
}

export interface TableToolsProps {
  position: TablePosition | null
  onInsertRow: (above: boolean) => void
  onDeleteRow: () => void
  onInsertColumn: (before: boolean) => void
  onDeleteColumn: () => void
} 