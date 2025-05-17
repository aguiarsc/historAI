export interface MessageProps {
  role: 'user' | 'ai'
  text: string
  isCommand?: boolean
  success?: boolean
}

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
  isCommand?: boolean
  success?: boolean
  timestamp?: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  isPinned: boolean
  firstUserMessage?: string
}

export interface ChatHistoryState {
  conversations: Record<string, Conversation>
  activeConversationId: string | null
}

export interface ChatHistoryProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onPinConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onNewConversation: () => void
}