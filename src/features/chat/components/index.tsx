import { useState, useRef, useEffect } from 'react'
import { FaBookmark, FaCode, FaPaperPlane, FaKey, FaQuestionCircle, FaPlus, FaChartBar, FaCopy } from 'react-icons/fa'
import Message from './Message'
import ChatHistory from './ChatHistory'
import ApiUsageDashboard from './ApiUsageDashboard'
import { sendToGemini } from '../services/api'
import { parseCommand, executeCommand } from '../services/commandProcessor'
import { loadApiKey, saveApiKey } from '../services/secureStorage'
import { hasSeenWelcome, setSeenWelcome } from '../../../services/storage/settingsStorage'
import { 
  WELCOME_MESSAGE
} from '../constants'
import type { ChatMessage, ChatHistoryState } from '../types'
import { Icon } from '../../../components/common/Icon';
import { 
  loadChatHistory,
  saveChatHistory,
  createNewConversation,
  addMessageToConversation,
  togglePinConversation,
  deleteConversation,
  cleanupOldConversations,
  getSortedConversations
} from '../services/chatHistoryManager'
import '../styles/SidebarChatBase.css'

/**
 * Main sidebar chat component for historIA chat interface.
 * Handles chat input, history, API key management, and UI toggles.
 */
export default function SidebarChat() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: Show a toast or feedback here
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const [showHelp, setShowHelp] = useState(false);
  const [showUsageDashboard, setShowUsageDashboard] = useState(false)
  
  useEffect(() => {
    async function loadKey() {
      const key = await loadApiKey()
      setApiKey(key)
    }
    loadKey()
  }, [])
  
  const [showChatHistory, setShowChatHistory] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const [chatHistory, setChatHistory] = useState<ChatHistoryState>({
    conversations: {},
    activeConversationId: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const activeConversation = chatHistory.activeConversationId 
    ? chatHistory.conversations[chatHistory.activeConversationId]
    : null
  const messages = activeConversation?.messages || []
  const isFirstMessage = useRef(activeConversation?.messages.length === 0)
  
  useEffect(() => {
    async function initChatHistory() {
      try {
        const history = await loadChatHistory()
        setChatHistory(history)
      } catch (error) {
        console.error('Error loading chat history from IndexedDB:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initChatHistory()
  }, [])
  
  const isFirstCleanupRender = useRef(true)
  
  const [welcomed, setWelcomed] = useState(false)
  
  useEffect(() => {
    async function checkWelcomeStatus() {
      try {
        const seen = await hasSeenWelcome()
        setWelcomed(seen)
      } catch (error) {
        console.error('Error checking welcome status:', error)
        setWelcomed(false)
      }
    }
    
    checkWelcomeStatus()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!welcomed && !chatHistory.activeConversationId && !isLoading) {
      const newConversation = createNewConversation(WELCOME_MESSAGE)
      const newHistory = {
        conversations: {
          ...chatHistory.conversations,
          [newConversation.id]: newConversation
        },
        activeConversationId: newConversation.id
      }
      
      setChatHistory(newHistory)
      saveChatHistory(newHistory).catch(error => {
        console.error('Failed to save welcome message:', error)
      })
      
      setSeenWelcome().catch(error => {
        console.error('Failed to save welcome status:', error)
      })
      
      setWelcomed(true)
    }
  }, [welcomed, chatHistory.activeConversationId, isLoading, chatHistory.conversations])
  
  useEffect(() => {    
    if (!isLoading && isFirstCleanupRender.current) {
      isFirstCleanupRender.current = false
      const cleanedHistory = cleanupOldConversations(chatHistory)
      
      if (cleanedHistory !== chatHistory) {
        setChatHistory(cleanedHistory)
      }
    }
  }, [chatHistory, isLoading])
  
  const handleNewConversation = () => {
    const newConversation = createNewConversation()
    const newHistory = {
      conversations: {
        ...chatHistory.conversations,
        [newConversation.id]: newConversation
      },
      activeConversationId: newConversation.id
    }
    
    setChatHistory(newHistory)
    saveChatHistory(newHistory).catch(error => {
      console.error('Failed to save new conversation:', error)
    })
    
    setShowChatHistory(false)
    isFirstMessage.current = true
  }
  
  const handleSelectConversation = (id: string) => {
    const newHistory = {
      ...chatHistory,
      activeConversationId: id
    }
    
    setChatHistory(newHistory)
    saveChatHistory(newHistory).catch(error => {
      console.error('Failed to save active conversation change:', error)
    })
    
    setShowChatHistory(false)
    isFirstMessage.current = false
  }
  
  const handlePinConversation = (id: string) => {
    const newHistory = togglePinConversation(chatHistory, id)
    
    setChatHistory(newHistory)
    saveChatHistory(newHistory).catch(error => {
      console.error('Failed to save pinned conversation change:', error)
    })
  }
  
  const handleDeleteConversation = (id: string) => {
    const newHistory = deleteConversation(chatHistory, id)
    
    setChatHistory(newHistory)
    saveChatHistory(newHistory).catch(error => {
      console.error('Failed to save conversation deletion:', error)
    })
    
    setShowChatHistory(false)
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const ensureActiveConversation = () => {
        if (chatHistory.activeConversationId) {
          return { 
            id: chatHistory.activeConversationId,
            isNew: false 
          };
        }
        
        const newConversation = createNewConversation();
        const newHistory = {
          conversations: {
            ...chatHistory.conversations,
            [newConversation.id]: newConversation
          },
          activeConversationId: newConversation.id
        };
        
        setChatHistory(newHistory);
        saveChatHistory(newHistory).catch(error => {
          console.error('Failed to save new conversation during send:', error);
        });
        
        return { 
          id: newConversation.id,
          isNew: true 
        };
      };
      
      const { id: conversationId, isNew } = ensureActiveConversation();
      isFirstMessage.current = isNew || messages.length === 0;
      
      const userMessage: ChatMessage = {
        role: 'user',
        text: input,
        timestamp: Date.now()
      };
      
      const historyWithUserMsg = addMessageToConversation(
        chatHistory,
        conversationId,
        userMessage
      );
      
      setChatHistory(historyWithUserMsg);
      saveChatHistory(historyWithUserMsg).catch(error => {
        console.error('Failed to save user message:', error);
      });
      
      setInput('');
      
      const commandData = parseCommand(input);
      
      if (commandData && commandData.type) {
        const { type, args } = commandData;
        const commandResult = await executeCommand(type, args, apiKey);
        
        const aiMessage: ChatMessage = {
          role: 'ai',
          text: commandResult.message,
          timestamp: Date.now(),
          isCommand: true,
          success: commandResult.success
        };
        
        const updatedHistory = addMessageToConversation(
          historyWithUserMsg,
          conversationId,
          aiMessage
        );
        
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory).catch(error => {
          console.error('Failed to save command result:', error);
        });
        
      } else if (!apiKey) {
        const aiMessage: ChatMessage = {
          role: 'ai',
          text: 'Please enter your Gemini API key to continue.',
          timestamp: Date.now()
        };
        
        const updatedHistory = addMessageToConversation(
          historyWithUserMsg,
          conversationId,
          aiMessage
        );
        
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory).catch(error => {
          console.error('Failed to save no API key message:', error);
        });
        setShowKey(true);
        
      } else {
        const aiResponse = await sendToGemini(input, apiKey);
        
        const aiMessage: ChatMessage = {
          role: 'ai',
          text: aiResponse,
          timestamp: Date.now()
        };
        
        const updatedHistory = addMessageToConversation(
          historyWithUserMsg,
          conversationId,
          aiMessage
        );
        
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory).catch(error => {
          console.error('Failed to save AI response:', error);
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      if (chatHistory.activeConversationId) {
        const errorMessage: ChatMessage = {
          role: 'ai',
          text: `Error: ${err.message || 'An unknown error occurred.'}`,
          timestamp: Date.now()
        };
        
        const updatedHistory = addMessageToConversation(
          chatHistory,
          chatHistory.activeConversationId,
          errorMessage
        );
        
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory).catch(error => {
          console.error('Failed to save error message:', error);
        });
      }
    } finally {
      setLoading(false)
    }
  }

  const sortedConversations = getSortedConversations(chatHistory);
  
  return (
    <div className="sidebar-chat">
      {isLoading ? (
        <div className="loading-indicator" style={{ padding: '20px', textAlign: 'center' }}>
          <div className="typing-indicator">
            <span>.</span><span>.</span><span>.</span>
          </div>
          <p>Loading chat history...</p>
        </div>
      ) : showChatHistory ? (
        <ChatHistory 
          conversations={sortedConversations}
          activeConversationId={chatHistory.activeConversationId}
          onSelectConversation={handleSelectConversation}
          onPinConversation={handlePinConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={handleNewConversation}
        />
      ) : (
        <>
          <div className="chat-header">
            <div className="chat-header-title">
              <Icon icon={FaCode} size={18} style={{ marginRight: '6px' }} /> 
              {activeConversation?.title || 'HistorIA'}
            </div>
            <div className="header-buttons">
              <button 
                className="icon-btn history-btn" 
                onClick={() => setShowChatHistory(true)} 
                title="Chat History"
              >
                <Icon icon={FaPlus} size={16} />
              </button>
              <button 
                className="help-button"
                onClick={() => {
                  setShowHelp(!showHelp)
                  setShowKey(false)
                  setShowUsageDashboard(false)
                }}
                title="Help"
              >
                <Icon icon={FaQuestionCircle} size={16} />
              </button>
              <button 
                className="api-key-button"
                onClick={() => {
                  setShowKey(!showKey)
                  setShowHelp(false)
                  setShowUsageDashboard(false)
                }}
                title="API Key"
              >
                <Icon icon={FaKey} size={16} />
              </button>
              <button 
                className="usage-dashboard-button"
                onClick={() => {
                  setShowUsageDashboard(!showUsageDashboard)
                  setShowKey(false)
                  setShowHelp(false)
                }}
                title="API Usage"
              >
                <Icon icon={FaChartBar} size={16} />
              </button>
            </div>
          </div>
          
          {showKey && (
            <div className="api-key-input">
              <input
                type="text"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => {
                  const newKey = e.target.value
                  setApiKey(newKey)
                  saveApiKey(newKey).catch(error => {
                    console.error('Failed to save API key:', error)
                  })
                }}
              />
              {error && <div className="api-key-error">{error}</div>}
            </div>
          )}
          
          {showUsageDashboard && (
            <div className="api-usage-container">
              <ApiUsageDashboard 
                activeConversationId={chatHistory.activeConversationId}
                isOpen={showUsageDashboard}
                onClose={() => setShowUsageDashboard(false)}
              />
            </div>
          )}
          
          {showHelp && (
            <div className="command-help">
              <div className="command-help-content">
                <h3>File Management Commands</h3>
                <div className="command-section">
                  <h4>Create a file</h4>
                  <div className="code-block">
                    <code>create --name="filename" --location="root/YourFolder/" --prompt="AI prompt to generate content"</code>
                    <button 
                      className="copy-button"
                      onClick={() => copyToClipboard('create --name="filename" --location="root/YourFolder/" --prompt="AI prompt to generate content"')}
                      title="Copy to clipboard"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
                </div>
                <div className="command-section">
                  <h4>Edit (extend) a file</h4>
                  <div className="code-block">
                    <code>edit --name="filename" --location="root/YourFolder/" --prompt="AI prompt for new content" --option="extend"</code>
                    <button 
                      className="copy-button"
                      onClick={() => copyToClipboard('edit --name="filename" --location="root/YourFolder/" --prompt="AI prompt for new content" --option="extend"')}
                      title="Copy to clipboard"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
                </div>
                <div className="command-section">
                  <h4>Edit (overwrite) a file</h4>
                  <div className="code-block">
                    <code>edit --name="filename" --location="root/YourFolder/" --prompt="AI prompt for new content" --option="overwrite"</code>
                    <button 
                      className="copy-button"
                      onClick={() => copyToClipboard('edit --name="filename" --location="root/YourFolder/" --prompt="AI prompt for new content" --option="overwrite"')}
                      title="Copy to clipboard"
                    >
                      <FaCopy size={14} />
                    </button>
                  </div>
                </div>
                <div className="command-notes">
                  <p>Notes:</p>
                  <ul>
                    <li>All your folders and files are stored in the root directory which can not be changed</li>
                    <li>File extension ".md" will be added automatically if not provided in the filename</li>
                    <li>Location should be the path to the directory (e.g., "root/YourFolder/")</li>
                    <li>Enclose argument values in double quotes</li>
                    <li>Context references (@root/YourFolder/file) provide additional information to Gemini</li>
                    <li>Directory references (@root/YourFolder/) include all files in that directory</li>
                    <li>Context should be added before the commands or prompt.</li>
                    <li>Example: @root/Creatures/vampires.md create --name="werewolves" --location="root/Creatures/" --prompt="With the context provided, write an essay about werevolves as natural enemies of vampires"</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="chat-content">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-chat-icon">
                  <Icon icon={FaBookmark} size={48} />
                </div>
                <p>Ask HistorIA anything about creative writing or use commands to manage your files.</p>
                <button className="new-chat-button" onClick={handleNewConversation}>
                  <Icon icon={FaPlus} size={16} /> New Conversation
                </button>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map((msg, i) => (
                  <Message key={`${activeConversation.id}_${i}`} role={msg.role} text={msg.text} isCommand={msg.isCommand} success={msg.success} />
                ))}
                {loading && (
                  <div className="msg-ai">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
          
          <div className="chat-input-row">
            <textarea
              className="chat-input-textarea"
              placeholder="Ask HistorIA something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              rows={2}
              style={{ resize: 'none' }}
            />
            <button 
              className="send-button"
              onClick={handleSend} 
              disabled={loading || !input.trim()}
            >
              <Icon icon={FaPaperPlane} size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  )
} 