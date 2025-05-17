import { useCallback } from 'react';
import type { TablePosition } from '../types';
import { insertTableRow, deleteTableRow, insertTableColumn, deleteTableColumn } from '../utils';

/**
 * React hook providing actions for markdown editing (bold, italic, lists, tables, etc).
 * @param {string} value - The current editor value.
 * @param {[number, number]} selection - The current selection range.
 * @param {(newText: string, newSelection?: [number, number]) => void} updateText - Function to update text and selection.
 * @returns {object} Markdown editing actions and table operations.
 */
export function useMarkdownActions(
  value: string,
  selection: [number, number],
  updateText: (newText: string, newSelection?: [number, number]) => void
) {
  const toggleBold = useCallback(() => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    
    if (selectedText) {
      const newText = value.slice(0, start) + `**${selectedText}**` + value.slice(end);
      updateText(newText, [start + 2, end + 2]);
    } else {
      const newText = value.slice(0, start) + '****' + value.slice(end);
      updateText(newText, [start + 2, start + 2]);
    }
  }, [value, selection, updateText]);

  const toggleItalic = useCallback(() => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    
    if (selectedText) {
      const newText = value.slice(0, start) + `*${selectedText}*` + value.slice(end);
      updateText(newText, [start + 1, end + 1]);
    } else {
      const newText = value.slice(0, start) + '**' + value.slice(end);
      updateText(newText, [start + 1, start + 1]);
    }
  }, [value, selection, updateText]);

  const toggleUnorderedList = useCallback(() => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    
    if (selectedText) {
      const lines = selectedText.split('\n');
      const formattedLines = lines.map(line => `- ${line}`).join('\n');
      const newText = value.slice(0, start) + formattedLines + value.slice(end);
      updateText(newText, [start, start + formattedLines.length]);
    } else {
      const newText = value.slice(0, start) + '- ' + value.slice(end);
      updateText(newText, [start + 2, start + 2]);
    }
  }, [value, selection, updateText]);

  const toggleOrderedList = useCallback(() => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    
    if (selectedText) {
      const lines = selectedText.split('\n');
      const formattedLines = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
      const newText = value.slice(0, start) + formattedLines + value.slice(end);
      updateText(newText, [start, start + formattedLines.length]);
    } else {
      const newText = value.slice(0, start) + '1. ' + value.slice(end);
      updateText(newText, [start + 3, start + 3]);
    }
  }, [value, selection, updateText]);

  const toggleBlockQuote = useCallback(() => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    
    if (selectedText) {
      const lines = selectedText.split('\n');
      const formattedLines = lines.map(line => `> ${line}`).join('\n');
      const newText = value.slice(0, start) + formattedLines + value.slice(end);
      updateText(newText, [start, start + formattedLines.length]);
    } else {
      const newText = value.slice(0, start) + '> ' + value.slice(end);
      updateText(newText, [start + 2, start + 2]);
    }
  }, [value, selection, updateText]);

  const insertTable = useCallback(() => {
    const [start, end] = selection;
    const tableTemplate = '| Header 1 | Header 2 | Header 3 |\n| :------- | :------: | -------: |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |';
    const newText = value.slice(0, start) + tableTemplate + value.slice(end);
    updateText(newText, [start, start + tableTemplate.length]);
  }, [value, selection, updateText]);

  const insertLink = useCallback((text: string, url: string) => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    const linkText = selectedText || text || 'link text';
    const linkUrl = url || 'https://example.com';
    
    const markdownLink = `[${linkText}](${linkUrl})`;
    const newText = value.slice(0, start) + markdownLink + value.slice(end);
    updateText(newText, [start, start + markdownLink.length]);
  }, [value, selection, updateText]);

  const insertImage = useCallback((imageUrl: string, altText: string = 'Image') => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    const alt = selectedText || altText;
    
    const markdownImage = `![${alt}](${imageUrl})`;
    const newText = value.slice(0, start) + markdownImage + value.slice(end);
    updateText(newText, [start, start + markdownImage.length]);
  }, [value, selection, updateText]);

  const insertCodeBlock = useCallback((language: string = '') => {
    const [start, end] = selection;
    const selectedText = value.slice(start, end);
    const newText = value.slice(0, start) + 
      "\`\`\`" + language + "\n" + 
      (selectedText || "Enter code here") + 
      "\n\`\`\`" + 
      value.slice(end);
    updateText(newText, [start + 3 + language.length + 1, end + 3 + language.length + 1]);
  }, [value, selection, updateText]);

  const handleTableOperations = {
    insertRow: useCallback((tablePos: TablePosition, above: boolean) => {
      updateText(insertTableRow(value, tablePos, above));
    }, [value, updateText]),
    
    deleteRow: useCallback((tablePos: TablePosition) => {
      updateText(deleteTableRow(value, tablePos));
    }, [value, updateText]),
    
    insertColumn: useCallback((tablePos: TablePosition, before: boolean) => {
      updateText(insertTableColumn(value, tablePos, before));
    }, [value, updateText]),
    
    deleteColumn: useCallback((tablePos: TablePosition) => {
      updateText(deleteTableColumn(value, tablePos));
    }, [value, updateText])
  };

  return {
    toggleBold,
    toggleItalic,
    toggleUnorderedList,
    toggleOrderedList,
    toggleBlockQuote,
    insertTable,
    insertLink,
    insertImage,
    insertCodeBlock,
    tableOperations: handleTableOperations,
  };
}
