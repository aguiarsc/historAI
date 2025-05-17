import type { ChatMessage, Conversation, ChatHistoryState } from '../types';
import { loadChatHistory as dbLoadChatHistory, saveChatHistory as dbSaveChatHistory } from '../../../services/storage/chatStorage';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
/**
 * Generates a unique conversation ID.
 * @returns {string}
 */
export function generateConversationId(): string {
  return 'conv_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a new conversation object, optionally with a welcome message.
 * @param {string} [welcomeMessage]
 * @returns {Conversation}
 */
export function createNewConversation(welcomeMessage?: string): Conversation {
  const now = Date.now();
  const id = generateConversationId();

  const initialMessages: ChatMessage[] = [];
  if (welcomeMessage) {
    initialMessages.push({
      role: 'ai',
      text: welcomeMessage,
      timestamp: now
    });
  }

  return {
    id,
    title: 'New Conversation',
    messages: initialMessages,
    createdAt: now,
    updatedAt: now,
    isPinned: false
  };
}

/**
 * Generates a conversation title from the first user message.
 * @param {string} firstUserMessage
 * @returns {string}
 */
export function generateConversationTitle(firstUserMessage: string): string {
  if (!firstUserMessage) return 'New Conversation';
  
  const maxTitleLength = 30;
  let title = firstUserMessage.trim();
  
  if (title.length > maxTitleLength) {
    title = title.substring(0, maxTitleLength) + '...';
  }
  
  return title;
}

/**
 * Loads chat history from persistent storage.
 * @returns {Promise<ChatHistoryState>}
 */
export async function loadChatHistory(): Promise<ChatHistoryState> {
  try {
    const history = await dbLoadChatHistory();
    return history;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return {
      conversations: {},
      activeConversationId: null
    };
  }
}

/**
 * Synchronous fallback for loading chat history (deprecated).
 * @returns {ChatHistoryState}
 */
export function loadChatHistorySync(): ChatHistoryState {
  console.warn('loadChatHistorySync is deprecated - use async loadChatHistory instead');
  return {
    conversations: {},
    activeConversationId: null
  };
}

/**
 * Saves chat history to persistent storage.
 * @param {ChatHistoryState} state
 * @returns {Promise<void>}
 */
export async function saveChatHistory(state: ChatHistoryState): Promise<void> {
  try {
    await dbSaveChatHistory(state);
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * Adds a message to a conversation in the chat history.
 * @param {ChatHistoryState} state
 * @param {string} conversationId
 * @param {ChatMessage} message
 * @returns {ChatHistoryState}
 */
export function addMessageToConversation(
  state: ChatHistoryState,
  conversationId: string,
  message: ChatMessage
): ChatHistoryState {
  if (!state.conversations[conversationId]) {
    return state;
  }
  
  if (!message.timestamp) {
    message.timestamp = Date.now();
  }

  const newState = { ...state };
  
  newState.conversations = {
    ...newState.conversations,
    [conversationId]: {
      ...newState.conversations[conversationId],
      messages: [...newState.conversations[conversationId].messages, message],
      updatedAt: Date.now()
    }
  };

  if (
    message.role === 'user' && 
    !newState.conversations[conversationId].firstUserMessage
  ) {
    newState.conversations[conversationId].firstUserMessage = message.text;
    newState.conversations[conversationId].title = generateConversationTitle(message.text);
  }

  saveChatHistory(newState).catch(error => {
    console.error('Failed to save chat history after adding message:', error);
  });
  
  return newState;
}

export function togglePinConversation(
  state: ChatHistoryState,
  conversationId: string
): ChatHistoryState {
  if (!state.conversations[conversationId]) {
    return state;
  }
  
  const newState = { ...state };
  
  newState.conversations = {
    ...newState.conversations,
    [conversationId]: {
      ...newState.conversations[conversationId],
      isPinned: !newState.conversations[conversationId].isPinned
    }
  };

  saveChatHistory(newState).catch(error => {
    console.error('Failed to save chat history after toggling pin:', error);
  });
  
  return newState;
}

export function deleteConversation(
  state: ChatHistoryState,
  conversationId: string
): ChatHistoryState {
  if (!state.conversations[conversationId]) {
    return state;
  }
  
  const newState = { ...state };
  
  const { [conversationId]: _, ...remainingConversations } = newState.conversations;
  newState.conversations = remainingConversations;

  if (newState.activeConversationId === conversationId) {
    newState.activeConversationId = null;
  }
  saveChatHistory(newState).catch(error => {
    console.error('Failed to save chat history after deleting conversation:', error);
  });
  
  return newState;
}

export function cleanupOldConversations(state: ChatHistoryState): ChatHistoryState {
  const now = Date.now();
  const cutoffTime = now - THREE_DAYS_MS;
  const newState = { ...state };
  
  Object.entries(state.conversations).forEach(([id, conversation]) => {
    if (!conversation.isPinned && conversation.updatedAt < cutoffTime) {
      const { [id]: _, ...remainingConversations } = newState.conversations;
      newState.conversations = remainingConversations;
      
      if (newState.activeConversationId === id) {
        newState.activeConversationId = null;
      }
    }
  });

  if (Object.keys(state.conversations).length !== Object.keys(newState.conversations).length) {
    saveChatHistory(newState).catch(error => {
      console.error('Failed to save chat history after cleanup:', error);
    });
  }
  
  return newState;
}

export function getSortedConversations(state: ChatHistoryState): Conversation[] {
  return Object.values(state.conversations).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    return b.updatedAt - a.updatedAt;
  });
}
