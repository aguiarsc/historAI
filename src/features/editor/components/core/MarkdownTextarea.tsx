import React from 'react';
import type { FindReplaceMatch } from '../../types';

/**
 * Props for the MarkdownTextarea component.
 * @property {string} value - Current markdown content
 * @property {(value: string) => void} onChange - Handler for content changes
 * @property {(selection: [number, number]) => void} onSelect - Handler for selection changes
 * @property {(e: React.MouseEvent<HTMLTextAreaElement>) => void} onClick - Click handler
 * @property {(e: React.KeyboardEvent<HTMLTextAreaElement>) => void} onKeyDown - Keydown handler
 * @property {(e: React.ClipboardEvent<HTMLTextAreaElement>) => void} onPaste - Paste handler
 * @property {FindReplaceMatch[]} highlightedMatches - Highlighted text matches
 * @property {(text: string, matches: FindReplaceMatch[]) => React.ReactNode[]} renderHighlightedText - Custom renderer for highlights
 */
interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: [number, number]) => void;
  onClick: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  highlightedMatches: FindReplaceMatch[];
  renderHighlightedText: (text: string, matches: FindReplaceMatch[]) => React.ReactNode[];
}

/**
 * Textarea for editing markdown with support for selection, highlighting, and custom overlays.
 * @param {MarkdownTextareaProps} props
 */
const MarkdownTextarea: React.FC<MarkdownTextareaProps> = ({
  value,
  onChange,
  onSelect,
  onClick,
  onKeyDown,
  onPaste,
  highlightedMatches,
  renderHighlightedText
}) => {
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    onSelect([start, end]);
  };

  return (
    <div className="editor-textarea-container">
      {highlightedMatches.length > 0 && (
        <div 
          className="editor-highlight-overlay"
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        >
          {renderHighlightedText(value, highlightedMatches)}
        </div>
      )}
      <textarea
        className="editor-textarea"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          handleSelect(e);
        }}
        onKeyDown={onKeyDown}
        onSelect={handleSelect}
        onClick={onClick}
        onPaste={onPaste}
        spellCheck={true}
        lang="en"
        placeholder="Type your markdown here..."
      />
    </div>
  );
};

export default MarkdownTextarea;
