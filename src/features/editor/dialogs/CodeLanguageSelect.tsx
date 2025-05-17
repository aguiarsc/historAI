import type { CodeLanguageSelectProps } from '../types'
import { CODE_LANGUAGES } from '../constants'

export default function CodeLanguageSelect({ isOpen, onClose, onSelectLanguage }: CodeLanguageSelectProps) {
  if (!isOpen) return null

  return (
    <div className="language-select">
      <div className="language-select-header">
        Select Language
        <button onClick={onClose}>&times;</button>
      </div>
      <div className="language-grid">
        {CODE_LANGUAGES.map(lang => (
          <button key={lang} onClick={() => onSelectLanguage(lang)}>
            {lang}
          </button>
        ))}
      </div>
    </div>
  )
} 