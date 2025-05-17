import { STORES, getValue, setValue } from './db';
import type { ChatHistoryState } from '../../features/chat/types';

export const CHAT_HISTORY_KEY = 'history';

export const loadChatHistory = async (): Promise<ChatHistoryState> => {
  try {
    const history = await getValue<ChatHistoryState>(STORES.CHAT_HISTORY, CHAT_HISTORY_KEY);
    
    if (!history) {
      return {
        conversations: {},
        activeConversationId: null
      };
    }
    
    return history;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return {
      conversations: {},
      activeConversationId: null
    };
  }
};

export const saveChatHistory = async (history: ChatHistoryState): Promise<void> => {
  try {
    await setValue(STORES.CHAT_HISTORY, CHAT_HISTORY_KEY, history);
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};
