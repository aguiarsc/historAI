import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import FileTree from './features/fileManager/components'
import MarkdownEditor from './features/editor/components'
import SidebarChat from './features/chat/components'
import { loadTheme, saveTheme, getCustomThemeVars } from './services/storage/settingsStorage'
import { FaSun, FaMoon } from 'react-icons/fa'
import './App.css'
import './styles/theme.css'
import './styles/ThemeCustomizer.css'

/**
 * Visual handle for resizing panels in the layout.
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS class.
 */
function ResizeHandle({ className = "" }) {
  return (
    <PanelResizeHandle className={`resize-handle ${className}`}>
      <div className="resize-handle-bar" />
    </PanelResizeHandle>
  )
}

/**
 * Main application component for HistorIA.
 * Handles layout, theme, and mode switching.
 */
function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [theme, setTheme] = useState('dark')
  const [themeLoaded, setThemeLoaded] = useState(false)
  
  const [isReaderMode, setIsReaderMode] = useState(false)
  const [isWriterMode, setIsWriterMode] = useState(false)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isEfficientMode, setIsEfficientMode] = useState(false)
  const [isPureWriterMode, setIsPureWriterMode] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const themeToggleRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    async function initTheme() {
      try {
        const storedTheme = await loadTheme()
        if (storedTheme) {
          setTheme(storedTheme)
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          setTheme('light')
        }
      } catch (error) {
        console.error('Error loading theme from IndexedDB:', error)
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          setTheme('light')
        }
      } finally {
        setThemeLoaded(true)
      }
    }
    
    initTheme()
  }, [])

  useEffect(() => {
    if (!selectedFile) {
      setFileContent('')
    }
  }, [selectedFile])

  async function applyCustomThemeVars(mode: string) {
    try {
      const vars = await getCustomThemeVars(mode);
      if (vars && typeof vars === 'object') {
        Object.entries(vars).forEach(([k, v]) => {
          document.documentElement.style.setProperty(k, v as string);
        });
      }
    } catch (error) {
      console.error('Error applying custom theme variables:', error);
    }
  }

  /**
   * Toggle between light and dark theme.
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme).catch(console.error);
  }, [theme])

  useEffect(() => {
    if (!themeLoaded) return
    
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme).catch(error => {
      console.error('Error saving theme to IndexedDB:', error)
    });
    
    const loadCustomVars = async () => {
      await applyCustomThemeVars(theme);
    };
    loadCustomVars();
  }, [theme, themeLoaded]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = async (e: MediaQueryListEvent) => {
      try {
        const storedTheme = await loadTheme();
        if (!storedTheme) {
          setTheme(e.matches ? 'light' : 'dark')
        }
      } catch (error) {
        console.error('Error checking theme in system change handler:', error);
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])


  const [previousState, setPreviousState] = useState({
    isReaderMode: false,
    isWriterMode: false,
    isSidebarVisible: true,
    isEfficientMode: false,
    isPureWriterMode: false
  });
  
  const toggleReaderMode = () => {
    if (isReaderMode) {
      setIsReaderMode(false)
    } else {
      setPreviousState({
        isReaderMode,
        isWriterMode,
        isSidebarVisible,
        isEfficientMode,
        isPureWriterMode
      });
      
      setIsReaderMode(true)
      setIsWriterMode(false)
      setIsEfficientMode(false)
      setIsPureWriterMode(false)
      setIsFocusMode(false)
    }
  }
  
  const toggleWriterMode = () => {
    if (isWriterMode) {
      setIsWriterMode(false)
    } else {
      setIsWriterMode(true)
      setIsReaderMode(false)
      setIsEfficientMode(false)
      setIsPureWriterMode(false)
      setIsFocusMode(false)
    }
  }
  
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible)
    if (isEfficientMode || isPureWriterMode || isFocusMode) {
      setIsEfficientMode(false)
      setIsPureWriterMode(false)
      setIsFocusMode(false)
    }
  }
  
  const toggleEfficientMode = () => {
    if (isEfficientMode) {
      setIsEfficientMode(false)
    } else {
      setIsEfficientMode(true)
      setIsPureWriterMode(false)
      setIsFocusMode(false)
      setIsReaderMode(false)
      setIsWriterMode(false)
      setIsSidebarVisible(true)
    }
  }
  
  const togglePureWriterMode = () => {
    if (isPureWriterMode) {
      setIsPureWriterMode(false)
    } else {
      setIsPureWriterMode(true)
      setIsEfficientMode(false)
      setIsFocusMode(false)
      setIsReaderMode(false)
      setIsWriterMode(false)
      setIsSidebarVisible(true)
    }
  }
  
  const toggleFocusMode = () => {
    if (isFocusMode) {
      setIsFocusMode(false);
      setIsReaderMode(previousState.isReaderMode);
      setIsWriterMode(previousState.isWriterMode);
      setIsSidebarVisible(previousState.isSidebarVisible);
      setIsEfficientMode(previousState.isEfficientMode);
      setIsPureWriterMode(previousState.isPureWriterMode);
    } else {
      setPreviousState({
        isReaderMode,
        isWriterMode,
        isSidebarVisible,
        isEfficientMode,
        isPureWriterMode
      });
      
      setIsFocusMode(true);
      setIsEfficientMode(false);
      setIsPureWriterMode(false);
      setIsReaderMode(false);
      setIsWriterMode(true);
      setIsSidebarVisible(false);
    }
  }

  return (
    <div className="historia-app" data-theme={theme} style={{
      '--color-accent-rgb': theme === 'light' ? '79, 70, 229' : '127, 156, 245',
    } as React.CSSProperties}>
      <button 
        ref={themeToggleRef}
        className="theme-toggle" 
        onClick={toggleTheme} 
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <FaMoon className="moon" />
        <FaSun className="sun" />
      </button>
      <PanelGroup direction="horizontal">
        {isSidebarVisible && (
          <>
            <Panel defaultSize={isPureWriterMode || isEfficientMode ? 30 : 20} minSize={15}>
              <PanelGroup direction="vertical">
                {!isEfficientMode && (
                  <Panel defaultSize={isPureWriterMode ? 100 : 50} minSize={20}>
                    <FileTree
                      onSelect={setSelectedFile}
                      selectedFile={selectedFile}
                      setFileContent={setFileContent}
                      fileContent={fileContent}
                    />
                  </Panel>
                )}
                
                {!isEfficientMode && !isPureWriterMode && <ResizeHandle className="horizontal" />}
                
                {!isPureWriterMode && (
                  <Panel defaultSize={isEfficientMode ? 100 : 50} minSize={20}>
                    <SidebarChat />
                  </Panel>
                )}
              </PanelGroup>
            </Panel>
            <ResizeHandle />
          </>
        )}
        
        <Panel defaultSize={isSidebarVisible ? 70 : 100}>
          <main className="main-content">
            {selectedFile ? (
              <MarkdownEditor
                value={fileContent}
                onChange={setFileContent}
                theme={theme as 'light' | 'dark'}
                isReaderMode={isReaderMode}
                isWriterMode={isWriterMode}
                isSidebarVisible={isSidebarVisible}
                isEfficientMode={isEfficientMode}
                isPureWriterMode={isPureWriterMode}
                isFocusMode={isFocusMode}
                toggleReaderMode={toggleReaderMode}
                toggleWriterMode={toggleWriterMode}
                toggleSidebar={toggleSidebar}
                toggleEfficientMode={toggleEfficientMode}
                togglePureWriterMode={togglePureWriterMode}
                toggleFocusMode={toggleFocusMode}
              />
            ) : (
              <div className="empty-editor-state">
                <div className="toolbar-container">
                  <MarkdownEditor
                    value=""
                    onChange={() => {}}
                    theme={theme as 'light' | 'dark'}
                    isReaderMode={isReaderMode}
                    isWriterMode={isWriterMode}
                    isSidebarVisible={isSidebarVisible}
                    isEfficientMode={isEfficientMode}
                    isPureWriterMode={isPureWriterMode}
                    isFocusMode={isFocusMode}
                    toggleReaderMode={toggleReaderMode}
                    toggleWriterMode={toggleWriterMode}
                    toggleSidebar={toggleSidebar}
                    toggleEfficientMode={toggleEfficientMode}
                    togglePureWriterMode={togglePureWriterMode}
                    toggleFocusMode={toggleFocusMode}
                    showToolbarOnly={true}
                  />
                </div>
                <div className="empty-editor-message">
                  Select or create a file to start editing
                </div>
              </div>
            )}
          </main>
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default App
