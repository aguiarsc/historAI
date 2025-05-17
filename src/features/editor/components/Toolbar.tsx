import { useState } from 'react';
import { 
  FaBold, FaItalic, FaListUl, FaListOl, FaQuoteRight, FaTable, 
  FaLink, FaImage, FaCode, FaBook, FaQuestion, 
  FaFilePdf, FaPalette, FaBars, FaEdit, FaKeyboard,
  FaFileAlt, FaComments
} from 'react-icons/fa'
import type { ToolbarAction } from '../types'
import ThemeCustomizerModal from '../../../styles/ThemeCustomizerModal';
import type { ThemeMode } from '../../../styles/ThemeCustomizerModal';

/**
 * Props for the Toolbar component.
 * @property {ToolbarAction[]} toolbarActions - List of toolbar actions
 * @property {(action: ToolbarAction) => void} onAction - Action handler
 * @property {() => void} toggleReaderMode - Toggle reader mode
 * @property {() => void} toggleWriterMode - Toggle writer mode
 * @property {() => void} toggleSidebar - Toggle sidebar
 * @property {() => void} toggleEfficientMode - Toggle efficient mode
 * @property {() => void} togglePureWriterMode - Toggle pure writer mode
 * @property {() => void} toggleFocusMode - Toggle focus mode
 * @property {boolean} isReaderMode - Reader mode state
 * @property {boolean} isWriterMode - Writer mode state
 * @property {boolean} isSidebarVisible - Sidebar visibility
 * @property {boolean} isEfficientMode - Efficient mode state
 * @property {boolean} isPureWriterMode - Pure writer mode state
 * @property {boolean} isFocusMode - Focus mode state
 * @property {{words: number, chars: number}} wordCount - Word and character count
 * @property {boolean} isSaving - Saving state
 * @property {() => void} onShowCheatSheet - Handler to show cheat sheet
 * @property {() => void} onExportPdf - Handler to export as PDF
 * @property {[number, number]} selection - Current text selection
 */
interface ToolbarProps {
  toolbarActions: ToolbarAction[]
  onAction: (action: ToolbarAction) => void
  toggleReaderMode: () => void
  toggleWriterMode: () => void
  toggleSidebar: () => void
  toggleEfficientMode: () => void
  togglePureWriterMode: () => void
  toggleFocusMode: () => void
  isReaderMode: boolean
  isWriterMode: boolean
  isSidebarVisible: boolean
  isEfficientMode: boolean
  isPureWriterMode: boolean
  isFocusMode: boolean
  wordCount: { words: number; chars: number }
  isSaving: boolean
  onShowCheatSheet: () => void
  onExportPdf: () => void
  selection: [number, number]
}

/**
 * Toolbar for markdown editor, providing formatting buttons and mode toggles.
 * @param {ToolbarProps} props
 */
export default function Toolbar({
  toolbarActions,
  onAction,
  toggleReaderMode,
  toggleWriterMode,
  toggleSidebar,
  toggleEfficientMode,
  togglePureWriterMode,
  toggleFocusMode,
  isReaderMode,
  isWriterMode,
  isSidebarVisible,
  isEfficientMode,
  isPureWriterMode,
  isFocusMode,
  wordCount,
  isSaving,
  onShowCheatSheet,
  onExportPdf,
  selection
}: ToolbarProps) {
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const themeAttr = document.documentElement.getAttribute('data-theme');
  const currentTheme: ThemeMode = themeAttr === 'light' ? 'light' : 'dark';
  const defaultActions: ToolbarAction[] = [
    { 
      icon: <FaBold />, 
      title: 'Bold',
      shortcut: 'b',
      action: (text, selection) => {
        const [start, end] = selection;
        return text.substring(0, start) + "**" + text.substring(start, end) + "**" + text.substring(end);
      }
    },
    { 
      icon: <FaItalic />, 
      title: 'Italic',
      shortcut: 'i',
      action: (text, selection) => {
        const [start, end] = selection;
        return text.substring(0, start) + "*" + text.substring(start, end) + "*" + text.substring(end);
      }
    },
    { 
      icon: <FaListUl />, 
      title: 'Unordered List',
      shortcut: 'u',
      action: (text, selection) => {
        const [start, end] = selection;
        const selectedText = text.substring(start, end);
        const listItems = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        return text.substring(0, start) + listItems + text.substring(end);
      }
    },
    { 
      icon: <FaListOl />, 
      title: 'Ordered List',
      shortcut: 'o',
      action: (text, selection) => {
        const [start, end] = selection;
        const selectedText = text.substring(start, end);
        const listItems = selectedText.split('\n').map((line, i) => `${i+1}. ${line}`).join('\n');
        return text.substring(0, start) + listItems + text.substring(end);
      }
    },
    { 
      icon: <FaQuoteRight />, 
      title: 'Blockquote',
      shortcut: 'q',
      action: (text, selection) => {
        const [start, end] = selection;
        const selectedText = text.substring(start, end);
        const quote = selectedText.split('\n').map(line => `> ${line}`).join('\n');
        return text.substring(0, start) + quote + text.substring(end);
      }
    },
    { 
      icon: <FaTable />, 
      title: 'Table',
      shortcut: 't',
      action: (text, selection) => {
        const [start, end] = selection;
        const tableTemplate = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |`;
        return text.substring(0, start) + tableTemplate + text.substring(end);
      }
    },
    { 
      icon: <FaLink />, 
      title: 'Link',
      shortcut: 'k',
      action: (text, selection) => {
        const [start, end] = selection;
        const selectedText = text.substring(start, end);
        const linkText = selectedText || 'Link text';
        return text.substring(0, start) + `[${linkText}](url)` + text.substring(end);
      }
    },
    { 
      icon: <FaImage />, 
      title: 'Image',
      shortcut: 'p',
      action: (text, selection) => {
        const [start, end] = selection;
        const selectedText = text.substring(start, end);
        const altText = selectedText || 'Image description';
        return text.substring(0, start) + `![${altText}](image-url)` + text.substring(end);
      }
    },
    { 
      icon: <FaCode />, 
      title: 'Code Block',
      shortcut: 'c',
      action: (text, selection) => {
        const [start, end] = selection;
        const selectedText = text.substring(start, end);
        return text.substring(0, start) + "```\n" + selectedText + "\n```" + text.substring(end);
      }
    }
  ]
  
  const hasTextSelected = selection[1] > selection[0]
  
  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        {(toolbarActions.length ? toolbarActions : defaultActions).map((action, i) => (
          <button
            key={i}
            title={action.title}
            onClick={() => onAction(action)}
            className={hasTextSelected ? 'text-selected' : ''}
          >
            {action.icon}
          </button>
        ))}
      </div>
      <div className="toolbar-group">
        <span className="word-count" title="Word and character count">
          {wordCount.words} words, {wordCount.chars} chars
          {hasTextSelected && ' (text selected)'}
        </span>
        <button
          title="Export as PDF"
          onClick={onExportPdf}
        >
          <FaFilePdf />
        </button>
        <button
          title="Markdown Cheat Sheet"
          onClick={onShowCheatSheet}
        >
          <FaQuestion />
        </button>
        <button
          title="Theme Customization"
          onClick={() => setThemeModalOpen(true)}
        >
          <FaPalette />
        </button>
        <button
          title="Reader Mode (Hide Editor)"
          onClick={toggleReaderMode}
          className={isReaderMode ? 'active-mode' : ''}
        >
          <FaBook />
        </button>
        <button
          title="Writer Mode (Hide Preview)"
          onClick={toggleWriterMode}
          className={isWriterMode ? 'active-mode' : ''}
        >
          <FaEdit />
        </button>
        <button
          title="Toggle Sidebar"
          onClick={toggleSidebar}
          className={!isSidebarVisible ? 'active-mode' : ''}
        >
          <FaBars />
        </button>
        <button
          title="Efficient Mode (Editor + Chat)"
          onClick={toggleEfficientMode}
          className={isEfficientMode ? 'active-mode' : ''}
        >
          <FaComments />
        </button>
        <button
          title="Pure Writer Mode (Editor + Files)"
          onClick={togglePureWriterMode}
          className={isPureWriterMode ? 'active-mode' : ''}
        >
          <FaFileAlt />
        </button>
        <button
          title="Focus Mode (Editor Only)"
          onClick={toggleFocusMode}
          className={isFocusMode ? 'active-mode' : ''}
        >
          <FaKeyboard />
        </button>
        {isSaving && <span className="save-indicator">Saving...</span>}
      </div>
      <ThemeCustomizerModal
        open={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={currentTheme}
      />
    </div>
  )
} 