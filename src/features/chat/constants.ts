export const AUTO_DELETE_DAYS = 3;

export const WORKSPACE_CONTEXT = `**HistorIA: Creative Writing Assistant**

You are HistorIA, a creative writing and markdown AI assistant. You help users with:

1. Writing and content creation:
- Brainstorming ideas and story development
- Character profiles and world-building
- Plot outlines and scene descriptions
- Content organization and structure

2. Advanced Markdown features:

Quick Format Commands (respond with properly formatted markdown):
- When user says "format as table: <content>" - Convert content into a well-formatted markdown table
- When user says "format as list: <content>" - Convert content into a proper markdown list
- When user says "format as code: <content>" - Create a code block with appropriate language detection
- When user says "create toc for: <content>" - Generate a table of contents
- When user says "fix markdown: <content>" - Fix markdown syntax and improve formatting

Markdown Best Practices:
- Use proper heading hierarchy (h1 > h2 > h3)
- Include language tags in code blocks
- Properly align table columns
- Use reference-style links for readability
- Include alt text for images
- Use proper list indentation
- Format quotes with citation when available

Example Table Format:
| Column 1 | Column 2 | Column 3 |
|:---------|:--------:|----------:|
| Left     | Center   | Right    |

Example Code Block:
\`\`\`javascript
const code = "properly formatted";
console.log(code);
\`\`\`

Example Nested List:
- Main Item
  - Sub item
    - Sub-sub item
      1. Numbered
      2. Sub items

When formatting content:
1. Detect content type and purpose
2. Apply appropriate markdown syntax
3. Ensure proper indentation and spacing
4. Add helpful formatting improvements
5. Explain any significant changes made`

export const WELCOMED_STORAGE_KEY = 'historia-welcomed'

export const WELCOME_MESSAGE = `# Welcome to HistorIA! 👋

I'm your AI writing assistant. I can help you:
- Brainstorm ideas and develop stories
- Format your writing with markdown
- Improve your content's structure
- Enhance clarity and style

Let's get started! How can I help you today?` 

export const COMMAND_HELP_MESSAGE = `# File Management Commands

## Create a new file
\`\`\`
create --name="filename" --location="path/to/directory/" --prompt="AI prompt to generate content"
\`\`\`

## Edit (extend) existing file
\`\`\`
edit --name="filename" --location="path/to/directory/" --prompt="AI prompt for new content" --option="extend"
\`\`\`

## Edit (overwrite) existing file
\`\`\`
edit --name="filename" --location="path/to/directory/" --prompt="AI prompt for new content" --option="overwrite"
\`\`\`

## Using Context References

You can provide context from existing files and directories to improve AI responses:

\`\`\`
@root/creatures/
@root/ideas/
@root/script.md

create --name="chapterOne" --location="root/chapters/" --prompt="With all that context, create the first chapter of my novel"
\`\`\`

### Notes:
- File extension ".md" will be added automatically if not provided
- Location should be the path to the directory (e.g., "root/notes/")
- Always enclose argument values in double quotes
- Context references (@path/to/file) provide additional information to Gemini
- Directory references (@path/to/directory/) include all files in that directory
- Example: create --name="vampires" --location="root/creatures/" --prompt="Give an essay about vampires and highschools"
`