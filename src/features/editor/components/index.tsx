import React, { useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import { findMatches, replaceAllMatches, preserveCase } from '../utils/searchUtils';
import { CHEAT_SHEET } from '../constants';
import { FaBold, FaItalic, FaListUl, FaListOl, FaQuoteRight, FaTable, 
  FaLink, FaImage, FaCode, FaSearch } from 'react-icons/fa';
import 'highlight.js/styles/github-dark.css';
import 'highlight.js/styles/github.css';

import type { EditorProps, FindReplaceMatch, FindReplaceOptions, ToolbarAction } from '../types';
import {
  insertTableRow,
  deleteTableRow,
  insertTableColumn,
  deleteTableColumn
} from '../utils';

import Toolbar from './Toolbar';
import TableTools from './TableTools';
import CheatSheet from '../dialogs/CheatSheet';
import CodeLanguageSelect from '../dialogs/CodeLanguageSelect';
import FindReplace from '../dialogs/FindReplace';
import LinkHelper from '../dialogs/LinkHelper';
import MarkdownPreview from './core/MarkdownPreview';
import MarkdownTextarea from './core/MarkdownTextarea';

import { useEditorState } from '../hooks/useEditorState';
import { useMarkdownActions } from '../hooks/useMarkdownActions';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useImageHandling } from '../hooks/useImageHandling';

import { renderHighlightedText as renderHighlightedTextUtil } from '../utils/searchUtils';

import '../styles/MarkdownEditorBase.css';
import '../styles/ToolbarModes.css';

/**
 * The main markdown editor component, supporting editing, preview, and toolbar actions.
 * @param {EditorProps} props - Editor properties including value, onChange, modes, and toggles.
 */
export default function MarkdownEditor({ 
  value, 
  onChange, 
  theme = 'dark',
  isReaderMode = false,
  isWriterMode = false,
  isSidebarVisible = true,
  isEfficientMode = false,
  isPureWriterMode = false,
  isFocusMode = false,
  toggleReaderMode = () => {},
  toggleWriterMode = () => {},
  toggleSidebar = () => {},
  toggleEfficientMode = () => {},
  togglePureWriterMode = () => {},
  toggleFocusMode = () => {},
  showToolbarOnly = false
}: EditorProps) {
  const editorState = useEditorState(value, onChange);
  const {
    selection, setSelection, isSaving, wordCount, selectedTableCell,
    showLanguageSelect, setShowLanguageSelect, showCheatSheet, setShowCheatSheet,
    showFindReplace, setShowFindReplace, showLinkHelper, setShowLinkHelper,
    highlightedMatches, setHighlightedMatches,
    updateText, handleEditorClick
  } = editorState;

  const actions = useMarkdownActions(value, selection, updateText);
  const {
    toggleBold, toggleItalic, toggleUnorderedList, toggleOrderedList,
    toggleBlockQuote, insertTable, insertLink, insertImage, insertCodeBlock
  } = actions;

  const {
    dragOver, fileInputRef, handleImageUpload, openFileSelector,
    handleDragEvents, handlePaste
  } = useImageHandling(insertImage);
  
  const dragEventHandlers = {
    onDragOver: handleDragEvents.onDragOver,
    onDragEnter: handleDragEvents.onDragOver || ((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }),
    onDragLeave: handleDragEvents.onDragLeave,
    onDrop: handleDragEvents.onDrop
  };

  const toolbarActions: { [key: string]: () => void } = {
    bold: toggleBold,
    italic: toggleItalic,
    'unordered-list': toggleUnorderedList,
    'ordered-list': toggleOrderedList,
    quote: toggleBlockQuote,
    table: insertTable,
    link: () => setShowLinkHelper(true),
    image: openFileSelector,
    code: () => setShowLanguageSelect(true),
    find: () => setShowFindReplace(true)
  };

  const handleToolbarAction = useCallback((action: ToolbarAction | string) => {
    if (typeof action === 'string') {
      const handler = toolbarActions[action];
      if (handler) {
        handler();
      } else if (action === 'reader-mode') {
        toggleReaderMode();
      } else if (action === 'writer-mode') {
        toggleWriterMode();
      } else if (action === 'help') {
        setShowCheatSheet(true);
      } else if (action === 'pdf') {
        handleExportPdf();
      }
    } else if (action.action) {
      const newText = action.action(value, selection);
      updateText(newText);
    }
  }, [toolbarActions, toggleReaderMode, toggleWriterMode, setShowCheatSheet, value, selection, updateText]);

  const handleExportPdf = useCallback(() => {
    const previewElement = document.querySelector('.markdown-preview');
    if (!previewElement) return;

    const opt = {
      margin: 1,
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(previewElement as HTMLElement).save();
  }, []);
  
  const { handlePairs } = useKeyboardShortcuts(
    setShowLanguageSelect,
    setShowFindReplace,
    setShowLinkHelper,
    toggleWriterMode,
    handleExportPdf,
    {
      toggleBold,
      toggleItalic,
      toggleUnorderedList,
      toggleOrderedList,
      toggleBlockQuote,
      insertTable,
      ...toolbarActions
    }
  );

  const handleFindReplace = useCallback((findText: string,
    replaceText: string,
    replaceAll: boolean,
    options: FindReplaceOptions
  ) => {
    if (!findText) return;
    
    const matches = findMatches(value, findText, options);
    
    if (matches.length > 0) {
      if (replaceAll) {
        const newText = replaceAllMatches(
          value, 
          matches, 
          replaceText, 
          options.preserveCase
        );
        updateText(newText);
      } else {
        const currentPos = selection[0];
        const nextMatch = matches.find(match => match.index >= currentPos) || matches[0];
        
        const finalReplacement = options.preserveCase 
          ? preserveCase(nextMatch.text, replaceText) 
          : replaceText;
        
        const start = nextMatch.index;
        const end = start + nextMatch.length;
        
        const newText = value.slice(0, start) + 
                         finalReplacement + 
                         value.slice(end);
        
        const newPos = start + finalReplacement.length;
        updateText(newText, [newPos, newPos]);
      }
    }
  }, [value, selection, updateText]);

  const handleInsertLink = useCallback((text: string, url: string) => {
    insertLink(text, url);
  }, [insertLink]);
  const renderHighlightedText = useCallback((text: string, matches: FindReplaceMatch[]) => {
    return renderHighlightedTextUtil(text, matches);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handlePairs(e, value, selection, updateText);
  }, [value, selection, updateText, handlePairs]);

  if (showToolbarOnly) {
    return (
      <div className={`markdown-editor theme-${theme} toolbar-only`}>
        <Toolbar
          toolbarActions={[]}
          onAction={() => {}}
          toggleReaderMode={toggleReaderMode}
          toggleWriterMode={toggleWriterMode}
          toggleSidebar={toggleSidebar}
          toggleEfficientMode={toggleEfficientMode}
          togglePureWriterMode={togglePureWriterMode}
          toggleFocusMode={toggleFocusMode}
          isReaderMode={isReaderMode}
          isWriterMode={isWriterMode}
          isSidebarVisible={isSidebarVisible}
          isEfficientMode={isEfficientMode}
          isPureWriterMode={isPureWriterMode}
          isFocusMode={isFocusMode}
          wordCount={{ words: 0, chars: 0 }}
          isSaving={false}
          onShowCheatSheet={() => {}}
          onExportPdf={() => {}}
          selection={[0, 0]}
        />
      </div>
    );
  }

  const showEditorPane = !isReaderMode || isWriterMode;
  const showPreviewPane = !isWriterMode || isReaderMode;
  
  const editorWrapperClasses = [
    'editor-wrapper',
    showPreviewPane ? '' : 'full-width',
    isWriterMode ? 'writer-mode-active' : '',
    isFocusMode ? 'focus-mode-active' : ''
  ].filter(Boolean).join(' ');
  
  const previewWrapperClasses = [
    'preview-wrapper',
    showEditorPane ? '' : 'full-width',
    isReaderMode ? 'reader-mode-active' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={`markdown-editor theme-${theme} ${isReaderMode ? 'reader-mode' : ''} ${isWriterMode ? 'writer-mode' : ''} ${isFocusMode ? 'focus-mode' : ''}`}
      onDragOver={dragEventHandlers.onDragOver}
      onDragEnter={dragEventHandlers.onDragEnter}
      onDragLeave={dragEventHandlers.onDragLeave}
      onDrop={dragEventHandlers.onDrop}
    >
      <Toolbar
        toolbarActions={[
          { 
            icon: <FaBold />, 
            title: 'Bold Text',
            shortcut: 'b',
            action: (text, selection) => {
              const [start, end] = selection;
              const selectedText = text.substring(start, end);
              return text.substring(0, start) + `**${selectedText}**` + text.substring(end);
            }
          },
          { 
            icon: <FaItalic />, 
            title: 'Italic Text',
            shortcut: 'i',
            action: (text, selection) => {
              const [start, end] = selection;
              const selectedText = text.substring(start, end);
              return text.substring(0, start) + `*${selectedText}*` + text.substring(end);
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
            title: 'Insert Table',
            shortcut: 't',
            action: (text, selection) => {
              const [start, end] = selection;
              const tableTemplate = `| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |`;
              return text.substring(0, start) + tableTemplate + text.substring(end);
            }
          },
          { 
            icon: <FaLink />, 
            title: 'Insert Link',
            shortcut: 'l',
            action: (text, selection) => {
              const [start, end] = selection;
              const selectedText = text.substring(start, end);
              const linkText = selectedText || 'Link text';
              return text.substring(0, start) + `[${linkText}](url)` + text.substring(end);
            }
          },
          { 
            icon: <FaImage />, 
            title: 'Insert Image',
            shortcut: 'g',
            action: (text, selection) => {
              const [start, end] = selection;
              const selectedText = text.substring(start, end);
              const altText = selectedText || 'Image description';
              return text.substring(0, start) + `![${altText}](image-url)` + text.substring(end);
            }
          },
          { 
            icon: <FaCode />, 
            title: 'Insert Code Block',
            shortcut: 'c',
            action: (text, selection) => {
              const [start, end] = selection;
              const selectedText = text.substring(start, end);
              return text.substring(0, start) + "```\n" + selectedText + "\n```" + text.substring(end);
            }
          },
          { 
            icon: <FaSearch />, 
            title: 'Find & Replace',
            shortcut: 'f',
            action: (text, _selection) => text
          }
        ]}
        onAction={handleToolbarAction}
        toggleReaderMode={toggleReaderMode}
        toggleWriterMode={toggleWriterMode}
        toggleSidebar={toggleSidebar}
        toggleEfficientMode={toggleEfficientMode}
        togglePureWriterMode={togglePureWriterMode}
        toggleFocusMode={toggleFocusMode}
        isReaderMode={isReaderMode}
        isWriterMode={isWriterMode}
        isSidebarVisible={isSidebarVisible}
        isEfficientMode={isEfficientMode}
        isPureWriterMode={isPureWriterMode}
        isFocusMode={isFocusMode}
        onExportPdf={handleExportPdf}
        onShowCheatSheet={() => setShowCheatSheet(true)}
        wordCount={wordCount}
        isSaving={isSaving}
        selection={selection}
      />

      <CheatSheet
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
        cheatSheetData={CHEAT_SHEET}
      />

      <CodeLanguageSelect
        isOpen={showLanguageSelect}
        onClose={() => setShowLanguageSelect(false)}
        onSelectLanguage={insertCodeBlock}
      />

      <FindReplace
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        onFindReplace={handleFindReplace}
        onHighlightMatches={setHighlightedMatches}
        content={value}
      />

      <LinkHelper
        isOpen={showLinkHelper}
        onClose={() => setShowLinkHelper(false)}
        onInsertLink={handleInsertLink}
      />

      <TableTools
        position={selectedTableCell}
        onInsertRow={(above) => updateText(insertTableRow(value, selectedTableCell, above))}
        onDeleteRow={() => updateText(deleteTableRow(value, selectedTableCell))}
        onInsertColumn={(before) => updateText(insertTableColumn(value, selectedTableCell, before))}
        onDeleteColumn={() => updateText(deleteTableColumn(value, selectedTableCell))}
      />

      <div className="editor-content layout-container">
        {showEditorPane && (
          <div className={editorWrapperClasses}>
            <MarkdownTextarea
              value={value}
              onChange={onChange}
              onSelect={setSelection}
              onClick={handleEditorClick}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              highlightedMatches={highlightedMatches}
              renderHighlightedText={renderHighlightedText}
            />
          </div>
        )}

        {showPreviewPane && (
          <div className={previewWrapperClasses}>
            <MarkdownPreview 
              content={value} 
              theme={theme} 
            />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = '';
        }}
      />

      {dragOver && (
        <div className="drag-overlay">
          Drop image here
        </div>
      )}
    </div>
  );
}
