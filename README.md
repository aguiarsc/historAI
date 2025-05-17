# historIA

![Image](https://github.com/user-attachments/assets/33f91e29-6ca4-4f2b-971d-41e9501babde)

A sophisticated AI-powered markdown editor and writing assistant for content creators, writers, and historians.

## 📖 Overview

historIA combines a powerful markdown editor with AI capabilities to enhance your writing experience. Create, edit, and organize your markdown files with an intuitive interface while leveraging AI assistance to improve your content. Perfect for writers, content creators, and anyone who wants to streamline their documentation workflow.

## ✨ Features

### 🖋️ Advanced Markdown Editor

-   **Real-time Preview**: See your formatted markdown as you type
-   **Multiple View Modes**:
    -   Reader Mode - Focus on the rendered output
    -   Writer Mode - Focus on the editing experience
    -   Focus Mode - Distraction-free writing environment
    -   Efficient Mode - Optimized workspace layout
    -   Pure Writer Mode - Dedicated writing space
-   **Rich Formatting Tools**: Bold, italic, lists, blockquotes, tables, code blocks, and more
-   **Keyboard Shortcuts**: For faster editing and navigation
-   **Find & Replace**: Powerful text search and replacement
-   **PDF Export**: Convert your markdown documents to PDF
-   **Drag & Drop**: Easy image insertion

### 📁 File Management

-   **Hierarchical File System**: Organize files in folders and subfolders
-   **File Operations**: Create, rename, and delete files and folders
-   **Auto-save**: Automatically saves your work

### 🤖 AI Assistant Integration

-   **Gemini AI**: Powered by Google's Gemini AI model
-   **Chat Interface**: Conversational AI assistance
-   **Command System**: Create and edit files with AI through commands
-   **Chat History**: Keep track of your conversations

### 🎨 UI/UX Features

-   **Theme Support**: Light and dark modes
-   **Resizable Panels**: Customize your workspace layout
-   **Responsive Design**: Works on various screen sizes

## 🚀 Installation

```bash
# Clone the repository
git clone [https://github.com/aguiarsc/historIA.git](https://github.com/aguiarsc/historIA)
cd historIA

# Install dependencies
npm install

# Start the development server
npm run dev
````

## 🔧 Setup

### Gemini API Key

To use the AI features, you'll need to:

1.  Get a Gemini API key from Google AI Studio.
2.  Add your key via the API Key button in the chat sidebar.

## 🎮 Usage

### Writing & Editing

  - Create a new file using the File Tree.
  - Use the toolbar to format your content.
  - Toggle between different view modes for an optimal writing experience.
  - Use keyboard shortcuts for frequently used actions (see help for all shortcuts).

### Using AI Assistant

  - Ask questions in the chat input.

  - Use commands to generate content:

    ```bash
    # Create a new file with AI-generated content
    create --name="filename" --location="path/to/directory/" --prompt="AI prompt to generate content"

    # Extend an existing file with new content
    edit --name="filename" --location="path/to/directory/" --prompt="AI prompt for new content" --option="extend"

    # Overwrite file with completely new content
    edit --name="filename" --location="path/to/directory/" --prompt="AI prompt for new content" --option="overwrite"
    ```

### Exporting

  - Use the PDF export button to save your document as a PDF.

## 📂 Project Structure

```
historIA/
├── src/                  # Source files
│   ├── components/       # Common UI components
│   ├── features/         # Main application features
│   │   ├── chat/         # AI chat functionality
│   │   ├── editor/       # Markdown editor
│   │   └── fileManager/  # File system management
│   ├── services/         # Utilities and services
│   ├── styles/           # CSS and styling
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── index.html            # HTML entry point
├── package.json          # Project dependencies
└── vite.config.ts        # Vite configuration
```

## 🔨 Technologies Used

  - **React 19**: Modern UI framework
  - **TypeScript**: Type-safe JavaScript
  - **Vite**: Fast build tool and development server
  - **React Markdown**: Markdown rendering
  - **React Resizable Panels**: Flexible layout system
  - **IndexedDB**: Local storage for files and preferences
  - **html2pdf.js**: PDF export functionality
  - **highlight.js**: Syntax highlighting for code blocks

## 💡 Contributing

Contributions are welcome\! Please feel free to submit a Pull Request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the `LICENSE` file for details.
