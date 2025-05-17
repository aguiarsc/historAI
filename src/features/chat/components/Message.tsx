import { useState } from 'react'
import { FaCopy, FaMarkdown } from 'react-icons/fa'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import { sanitizeSchema } from '../../editor/utils/sanitize'
import 'highlight.js/styles/github-dark.css'
import 'highlight.js/styles/github.css'
import type { MessageProps } from '../types'

/**
 * Renders a chat message with markdown formatting, copy actions, and security for links/images.
 * @param {MessageProps} props - The message properties (role, text, isCommand, success).
 */
export default function Message({ role, text, isCommand, success }: MessageProps) {
  const [copyMarkdownFeedback, setCopyMarkdownFeedback] = useState(false)
  const [copyTextFeedback, setCopyTextFeedback] = useState(false)
  const theme = document.documentElement.getAttribute('data-theme') || 'dark'

  /**
   * Copies the given text to the clipboard and shows feedback.
   * @param {string} text - The text to copy.
   * @param {boolean} isMarkdown - Whether the text is markdown or plain text.
   */
  const copyToClipboard = async (text: string, isMarkdown: boolean) => {
    try {
      await navigator.clipboard.writeText(text)
      if (isMarkdown) {
        setCopyMarkdownFeedback(true)
        setTimeout(() => setCopyMarkdownFeedback(false), 1500)
      } else {
        setCopyTextFeedback(true)
        setTimeout(() => setCopyTextFeedback(false), 1500)
      }
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  /**
   * Copies the formatted (plain text) version of the message to the clipboard.
   */
  const copyFormatted = () => {
    const temp = document.createElement('div')
    temp.innerHTML = text
    const cleanText = temp.textContent || temp.innerText
    copyToClipboard(cleanText, false)
  }

  const secureComponents = {
    /**
     * Custom anchor element to prevent javascript: links.
     */
    a: ({ node, ...props }: any) => {
      if (props.href?.startsWith('javascript:')) {
        return <span>{props.children}</span>;
      }
      return <a {...props} target="_blank" rel="noopener noreferrer" />;
    },
    /**
     * Custom image element to only allow safe sources.
     */
    img: ({ node, ...props }: any) => {
      const safeSrc = props.src?.startsWith('http') || props.src?.startsWith('data:image')
        ? props.src : '';
      return <img 
        style={{maxWidth: '100%'}} 
        {...props} 
        src={safeSrc}
        alt={props.alt || ''}
        onError={(e) => {
          e.currentTarget.src = ''; 
          e.currentTarget.alt = 'Error loading image';
        }}
      />;
    }
  };

  return (
    <div className={`msg-${role} ${isCommand ? 'msg-command' : ''} ${isCommand && success === false ? 'msg-error' : ''}`}>
      {role === 'user' ? (
        <span className="msg-content">{text}</span>
      ) : isCommand ? (
        <div className={`msg-content command-content ${theme}-theme`}>
          <div className="command-status">
            {success ? '✅ Command executed successfully' : '❌ Command failed'}
          </div>
          <ReactMarkdown
            children={text}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              [rehypeSanitize, sanitizeSchema],
              rehypeHighlight
            ]}
            components={secureComponents}
          />
        </div>
      ) : (
        <div className={`msg-content markdown-content ${theme}-theme`}>
          <div className="msg-actions">
            <button 
              title="Copy markdown" 
              onClick={() => copyToClipboard(text, true)}
              className={`copy-btn ${copyMarkdownFeedback ? 'copied' : ''}`}
            >
              <FaMarkdown />
            </button>
            <button 
              title="Copy formatted text" 
              onClick={copyFormatted}
              className={`copy-btn ${copyTextFeedback ? 'copied' : ''}`}
            >
              <FaCopy />
            </button>
          </div>
          <ReactMarkdown
            children={text}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              [rehypeSanitize, sanitizeSchema],
              rehypeHighlight
            ]}
            components={secureComponents}
          />
        </div>
      )}
    </div>
  )
}