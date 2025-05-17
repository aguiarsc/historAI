import { useState, useRef, useEffect, useCallback } from 'react';
import type { TablePosition, FindReplaceMatch } from '../types';
import { calculateWordCount, findTableAtCursor } from '../utils';

/**
 * React hook for managing editor state, selection, word count, and UI toggles.
 * @param {string} value - The current editor value.
 * @param {(value: string) => void} onChange - Callback to update the editor value.
 * @returns {object} Editor state and utility functions.
 */
export function useEditorState(
  value: string,
  onChange: (value: string) => void
) {
  const [selection, setSelection] = useState<[number, number]>([0, 0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
  const [selectedTableCell, setSelectedTableCell] = useState<TablePosition | null>(null);
  
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showLinkHelper, setShowLinkHelper] = useState(false);
  
  const [highlightedMatches, setHighlightedMatches] = useState<FindReplaceMatch[]>([]);
  
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  
  const updateText = useCallback((newText: string, newSelection?: [number, number]) => {
    onChange(newText);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setIsSaving(false);
    }, 1000);

    if (newSelection) {
      setSelection(newSelection);
      requestAnimationFrame(() => {
        const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.setSelectionRange(...newSelection);
          textarea.focus();
        }
      });
    }
  }, [onChange]);

  useEffect(() => {
    setWordCount(calculateWordCount(value));
  }, [value]);
  useEffect(() => {
    if (isSaving) {
      const originalTitle = document.title;
      document.title = '● ' + originalTitle;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [isSaving]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);
  const handleEditorClick = useCallback(() => {
    const tablePosition = findTableAtCursor(value, selection[0]);
    setSelectedTableCell(tablePosition);
  }, [value, selection]);

  return {
    selection,
    setSelection,
    isSaving,
    showPreview,
    wordCount,
    selectedTableCell,
    
    showLanguageSelect,
    setShowLanguageSelect,
    showCheatSheet,
    setShowCheatSheet,
    showFindReplace,
    setShowFindReplace,
    showLinkHelper,
    setShowLinkHelper,
    
    highlightedMatches,
    setHighlightedMatches,
    
    updateText,
    togglePreview,
    handleEditorClick
  };
}
