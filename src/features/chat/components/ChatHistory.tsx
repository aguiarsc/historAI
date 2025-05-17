import { FaPlus, FaThumbtack, FaRegTrashAlt } from 'react-icons/fa';
import type { Conversation, ChatHistoryProps } from '../types';
import { Icon } from '../../../components/common/Icon';
import '../styles/ChatHistory.css';

/**
 * Renders the chat history sidebar with conversations and actions.
 * @param {ChatHistoryProps} props
 */
export default function ChatHistory({
  conversations,
  activeConversationId,
  onSelectConversation,
  onPinConversation,
  onDeleteConversation,
  onNewConversation
}: ChatHistoryProps) {
  return (
    <div className="chat-history">
      <div className="chat-history-header">
        <h3>Conversations</h3>
        <button 
          className="new-chat-btn"
          onClick={onNewConversation}
          title="Start a new conversation"
        >
          <Icon icon={FaPlus} size={14} /> New Chat
        </button>
      </div>
      
      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations yet</p>
            <button 
              className="start-chat-btn"
              onClick={onNewConversation}
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          <>
            {conversations.some(conv => conv.isPinned) && (
              <div className="conversation-group">
                <div className="conversation-group-header">
                  <Icon icon={FaThumbtack} size={12} /> Pinned
                </div>
                {conversations
                  .filter(conv => conv.isPinned)
                  .map(conversation => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === activeConversationId}
                      onSelect={onSelectConversation}
                      onPin={onPinConversation}
                      onDelete={onDeleteConversation}
                    />
                  ))
                }
              </div>
            )}
            
            <div className="conversation-group">
              <div className="conversation-group-header">
                Recent
              </div>
              {conversations
                .filter(conv => !conv.isPinned)
                .map(conversation => (
                  <ConversationItem 
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onSelect={onSelectConversation}
                    onPin={onPinConversation}
                    onDelete={onDeleteConversation}
                  />
                ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Props for a single conversation item in the chat history list.
 */
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Renders a single conversation item with actions.
 * @param {ConversationItemProps} props
 */
function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onPin,
  onDelete
}: ConversationItemProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <div 
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="conversation-content">
        <div className="conversation-title" title={conversation.title}>
          {conversation.title}
        </div>
        <div className="conversation-date">
          {formatDate(conversation.updatedAt)}
        </div>
      </div>
      <div className="conversation-actions">
        <button
          className={`pin-btn ${conversation.isPinned ? 'pinned' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onPin(conversation.id);
          }}
          title={conversation.isPinned ? "Unpin conversation" : "Pin conversation"}
        >
          <Icon icon={FaThumbtack} size={12} />
        </button>
        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this conversation?')) {
              onDelete(conversation.id);
            }
          }}
          title="Delete conversation"
        >
          <Icon icon={FaRegTrashAlt} size={12} />
        </button>
      </div>
    </div>
  );
}
