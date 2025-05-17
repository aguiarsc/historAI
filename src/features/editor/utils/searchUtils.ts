import React from 'react';
import type { FindReplaceMatch, FindReplaceOptions } from '../types';

export function findMatches(
  text: string, 
  searchTerm: string, 
  options: FindReplaceOptions
): FindReplaceMatch[] {
  if (!searchTerm) return [];

  const matches: FindReplaceMatch[] = [];
  const { matchCase: caseSensitive, matchWholeWord: wholeWord, useRegex = false } = options;
  
  let searchRegex: RegExp;
  
  try {
    if (useRegex) {
      searchRegex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
    } else {
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
      searchRegex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    }
    
    let match;
    while ((match = searchRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
        selected: false
      });
    }
  } catch (error) {
    console.error('Invalid regex pattern:', error);
  }
  
  return matches;
}

export function preserveCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  }
  
  if (original[0] === original[0].toUpperCase() && 
      original.slice(1) === original.slice(1).toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
  }
  
  return replacement;
}

export function replaceAllMatches(
  content: string,
  matches: FindReplaceMatch[],
  replacement: string,
  preserveCasing: boolean
): string {
  const sortedMatches = [...matches].sort((a, b) => (b.index) - (a.index));
  
  let result = content;
  
  for (const match of sortedMatches) {
    const { index: start, text } = match;
    const end = start + match.length;
    const finalReplacement = preserveCasing 
      ? preserveCase(text, replacement) 
      : replacement;
    
    result = result.slice(0, start) + finalReplacement + result.slice(end);
  }
  
  return result;
}

export function renderHighlightedText(
  text: string, 
  matches: FindReplaceMatch[]
): React.ReactNode[] {
  if (!text || !matches.length) return [text];
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
  
  sortedMatches.forEach((match, i) => {
    const start = match.index;
    const end = start + match.length;
    
    if (start > lastIndex) {
      result.push(text.slice(lastIndex, start));
    }
    result.push(
      React.createElement(
        'span',
        { key: `match-${i}`, className: 'search-highlight' },
        text.slice(start, end)
      )
    );
    
    lastIndex = end;
  });
  
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  
  return result;
}
