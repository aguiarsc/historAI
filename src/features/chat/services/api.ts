import { WORKSPACE_CONTEXT } from '../constants';
import { 
  trackApiRequest, 
  trackApiResponse, 
  trackApiError,
  updateConversationTokens,
  estimateTokenCount
} from './apiUsageTracker';

/**
 * Enhances markdown formatting by detecting code blocks and formatting tables.
 * @param {string} text - The markdown text to enhance.
 * @returns {Promise<string>} The enhanced markdown text.
 */
export async function enhanceMarkdownFormat(text: string): Promise<string> {
  text = text.replace(/^(\d+)\)\s+/gm, '$1. ')
  text = text.replace(/^[-*]\s+/gm, '- ')

  text = text.replace(/```\n([\s\S]*?)```/gm, (_, code) => {
    const langHints = {
      'import ': 'typescript',
      'function ': 'javascript',
      'def ': 'python',
      'class ': 'typescript',
      'console.log': 'javascript',
      'print(': 'python',
      '<div': 'html',
      '.class {': 'css',
      'SELECT ': 'sql',
      'package ': 'java',
    }

    let detectedLang = 'plaintext'
    for (const [hint, lang] of Object.entries(langHints)) {
      if (code.includes(hint)) {
        detectedLang = lang
        break
      }
    }

    return '```' + detectedLang + '\n' + code + '```'
  })

  text = text.replace(/\|.*\|/g, (match) => {
    if (match.includes('---')) {
      const cols = match.split('|').filter(Boolean)
      return '|' + cols.map(() => ':---:|').join('') + '\n'
    }
    return match
  })

  return text
}

/**
 * The maximum number of tokens allowed in a conversation.
 */
export const MAX_CONVERSATION_TOKENS = 128000;

/**
 * Checks if a conversation is approaching or exceeding the token limit.
 * @param {string} conversationId - The conversation ID.
 * @param {string} inputMessage - The new message to add.
 * @returns {Promise<{ status: 'ok' | 'warning' | 'limit_reached'; message?: string }>} The status and message if a limit is reached.
 */
export async function checkConversationTokenLimit(
  conversationId: string,
  inputMessage: string
): Promise<{ status: 'ok' | 'warning' | 'limit_reached'; message?: string }> {
  if (!conversationId) {
    return { status: 'ok' };
  }
  
  const allTokens = await import('./apiUsageTracker').then(m => m.loadConversationTokens());
  const conversationData = allTokens[conversationId];
  
  if (!conversationData) {
    return { status: 'ok' };
  }
  
  const currentTotal = conversationData.inputTokens + conversationData.outputTokens;
  const newInputTokens = estimateTokenCount(inputMessage);
  const estimatedNewTotal = currentTotal + newInputTokens;
  
  const WARNING_THRESHOLD = MAX_CONVERSATION_TOKENS * 0.7;
  const CRITICAL_THRESHOLD = MAX_CONVERSATION_TOKENS * 0.9;
  
  if (estimatedNewTotal >= CRITICAL_THRESHOLD) {
    return { 
      status: 'limit_reached', 
      message: `This conversation has reached ${Math.round(estimatedNewTotal / MAX_CONVERSATION_TOKENS * 100)}% of its token limit. Please start a new conversation to continue effectively.`
    };
  } else if (estimatedNewTotal >= WARNING_THRESHOLD) {
    return { 
      status: 'warning', 
      message: `This conversation is using ${Math.round(estimatedNewTotal / MAX_CONVERSATION_TOKENS * 100)}% of its available context. The model may begin to forget earlier messages.`
    };
  }
  
  return { status: 'ok' };
}

/**
 * Sends a message to the Gemini API and returns the response.
 * @param {string} message - The message to send.
 * @param {string} apiKey - The Gemini API key.
 * @param {boolean} [isFirstMessage=false] - Whether this is the first message in the conversation.
 * @param {string} [conversationId] - The conversation ID for tracking tokens.
 * @returns {Promise<string>} The Gemini response.
 */
export async function sendToGemini(
  message: string, 
  apiKey: string, 
  isFirstMessage = false,
  conversationId?: string
): Promise<string> {
  if (!apiKey) return 'Please set your Gemini API key.'
  try {
    const inputTokens = estimateTokenCount(message);
    
    await trackApiRequest(inputTokens);
    
    const hasContext = message.includes('Context information:') && message.includes('User request:')
    
    const wordCountMatch = message.match(/\b(\d{3,4})\s*(words?|paragraphs?)\b/i)
    const requestedWordCount = wordCountMatch ? parseInt(wordCountMatch[1]) : 0
    const isLongFormRequest = requestedWordCount > 500 || 
      /\b(essay|report|article|story|novel|chapter|ensayo|historia|capítulo|reporte|novela|cuento|comprehensive|detailed|in-depth|elaborate)\b/i.test(message)
    
    const outputTokenLimit = isLongFormRequest ? 8192 : 2048
    
    let formattedMessage: string
    if (isFirstMessage) {
      formattedMessage = `${WORKSPACE_CONTEXT}\n\n<human>${message}</human>\n\nRespond using markdown formatting:`
    } else if (hasContext) {
      const [contextPart, requestPart] = message.split('User request:')
      formattedMessage = `${WORKSPACE_CONTEXT}\n\n${contextPart}\n<human>User request:${requestPart}</human>\n\nRespond using markdown formatting while incorporating the provided context:`
    } else {
      if (requestedWordCount > 0) {
        formattedMessage = `<human>${message}</human>\n\nRespond using markdown formatting. IMPORTANT: Generate EXACTLY ${requestedWordCount} words as requested. Do not summarize or shorten your response.`
      } else {
        formattedMessage = `<human>${message}</human>\n\nRespond using markdown formatting:`
      }
    }

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    })

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=' + apiKey, {
      method: 'POST',
      headers,
      credentials: 'omit',
      body: JSON.stringify({
        contents: [{ parts: [{ text: formattedMessage }] }],
        generationConfig: {
          temperature: 1,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: outputTokenLimit,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      })
    })
    
    if (!res.ok) {
      const err = await res.text()
      await trackApiError(res.status, err);
      return `Gemini API error: ${res.status} ${err}`
    }
    
    const data = await res.json()
    const response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.'
    
    const outputTokens = estimateTokenCount(response);
    
    await trackApiResponse(outputTokens);
    
    if (conversationId) {
      await updateConversationTokens(conversationId, inputTokens, outputTokens);
    }
    
    return await enhanceMarkdownFormat(response)
  } catch (e) {
    console.error('API error:', e)
    await trackApiError(0, e instanceof Error ? e.message : 'Unknown network error');
    return 'Network or API error. Check browser console for details.'
  }
}