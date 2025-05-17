import { useState } from 'react'
import type { LinkHelperProps } from '../types'

export default function LinkHelper({ isOpen, onClose, onInsertLink }: LinkHelperProps) {
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  if (!isOpen) return null
  
  const handleSubmit = () => {
    if (linkText && linkUrl) {
      onInsertLink(linkText, linkUrl)
      setLinkText('')
      setLinkUrl('')
    }
  }

  return (
    <div className="link-helper-dialog">
      <div className="dialog-header">
        Insert Link
        <button onClick={onClose}>&times;</button>
      </div>
      <div className="dialog-content">
        <div className="input-group">
          <input
            type="text"
            value={linkText}
            onChange={e => setLinkText(e.target.value)}
            placeholder="Link text..."
            autoFocus
          />
          <input
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="URL..."
          />
        </div>
        <div className="dialog-actions">
          <button onClick={handleSubmit} disabled={!linkText || !linkUrl}>
            Insert Link
          </button>
        </div>
      </div>
    </div>
  )
} 