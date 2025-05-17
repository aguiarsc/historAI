import { useEffect, useCallback } from 'react';
import { MARKDOWN_PAIRS } from '../constants';
export function useKeyboardShortcuts(
  setShowLanguageSelect: (show: boolean) => void,
  setShowFindReplace: (show: boolean) => void,
  setShowLinkHelper: (show: boolean) => void,
  togglePreview: () => void,
  handleExportPdf: () => void,
  actions: {
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleUnorderedList: () => void;
    toggleOrderedList: () => void;
    toggleBlockQuote: () => void;
    insertTable: () => void;
    [key: string]: (() => void) | undefined;
  }
) {
  const handleKeyboardShortcut = useCallback((e: KeyboardEvent) => {
    const ctrlKey = e.ctrlKey || e.metaKey;
    
    if (ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          actions.toggleBold();
          break;
        case 'i':
          e.preventDefault();
          actions.toggleItalic();
          break;
        case 'l':
          e.preventDefault();
          setShowLinkHelper(true);
          break;
        case 'f':
          e.preventDefault();
          setShowFindReplace(true);
          break;
        case 'p':
          e.preventDefault();
          togglePreview();
          break;
        case '.':
          if (e.shiftKey) {
            e.preventDefault();
            setShowLanguageSelect(true);
          }
          break;
        case 's':
          e.preventDefault();
          break;
        case 'e':
          if (e.shiftKey) {
            e.preventDefault();
            handleExportPdf();
          }
          break;
      }
    }
  }, [
    actions, 
    setShowLinkHelper, 
    setShowFindReplace, 
    togglePreview, 
    setShowLanguageSelect,
    handleExportPdf
  ]);

  const handlePairs = useCallback((e: React.KeyboardEvent, 
    value: string, 
    selection: [number, number],
    updateText: (newText: string, newSelection?: [number, number]) => void) => {
    
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const [start, end] = selection;
      const newText = value.slice(0, start) + '  ' + value.slice(end);
      updateText(newText, [start + 2, start + 2]);
      return true;
    }

    const matchingPair = MARKDOWN_PAIRS.find(p => {
      return p.open === e.key || (p.open.length > 1 && p.open[0] === e.key);
    });
    
    if (matchingPair) {
      const [start, end] = selection;
      const selectedText = value.slice(start, end);
      
      if (start !== end) {
        e.preventDefault();
        const newText = value.slice(0, start) + matchingPair.open + selectedText + matchingPair.close + value.slice(end);
        updateText(newText, [start + matchingPair.open.length, start + matchingPair.open.length + selectedText.length]);
        return true;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const [start] = selection;
      const currentLine = value.substring(0, start).split('\n').pop() || '';
      
      const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+/);
      if (listMatch) {
        e.preventDefault();
        const [fullMatch, whitespace, marker] = listMatch;
        
        if (currentLine.trim() === fullMatch.trim()) {
          const textBefore = value.substring(0, start - fullMatch.length);
          const textAfter = value.substring(start);
          const newText = textBefore + textAfter;
          updateText(newText, [start - fullMatch.length, start - fullMatch.length]);
        } else {
          let nextMarker = marker;
          if (/^\d+\./.test(marker)) {
            const num = parseInt(marker);
            nextMarker = (num + 1) + '.';
          }
          const insertion = '\n' + whitespace + nextMarker + ' ';
          const newText = value.slice(0, start) + insertion + value.slice(start);
          updateText(newText, [start + insertion.length, start + insertion.length]);
        }
        return true;
      }
    }

    return false;
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [handleKeyboardShortcut]);

  return {
    handlePairs
  };
}
