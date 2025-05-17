import type { Pair, CheatSheetData } from './types'

export const CODE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php',
  'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'html', 'css', 'sql',
  'bash', 'markdown', 'json', 'yaml', 'xml'
]

export const MARKDOWN_PAIRS: Pair[] = [
  { open: '**', close: '**' },
  { open: '*', close: '*' },
  { open: '__', close: '__' },
  { open: '_', close: '_' },
  { open: '`', close: '`' },
  { open: '[', close: ']' },
  { open: '(', close: ')' }
]

export const CHEAT_SHEET: CheatSheetData = {
  'Headers': {
    '# Header 1': 'Largest heading',
    '## Header 2': 'Second heading',
    '### Header 3': 'Third heading'
  },
  'Emphasis': {
    '*italic* or _italic_': 'Italic text',
    '**bold** or __bold__': 'Bold text',
    '***bold italic***': 'Bold and italic'
  },
  'Lists': {
    '1. Item 1\n2. Item 2': 'Numbered list',
    '- Item 1\n- Item 2': 'Bullet list',
    '  - Nested': 'Indented list item'
  },
  'Links & Images': {
    '[Link text](url)': 'Hyperlink',
    '![Alt text](image-url)': 'Image',
    '[ref link][1]\n[1]: url': 'Reference link'
  },
  'Code': {
    '`inline code`': 'Inline code',
    '```language\ncode block\n```': 'Code block with syntax'
  },
  'Tables': {
    '| Header | Header |\n|--------|--------|\n| Cell   | Cell   |': 'Basic table',
    '|:--|:--:|--:|\nLeft|Center|Right': 'Column alignment'
  },
  'Other': {
    '> Quote text': 'Blockquote',
    '---': 'Horizontal rule',
    '\\*literal*': 'Escape markdown'
  }
} 