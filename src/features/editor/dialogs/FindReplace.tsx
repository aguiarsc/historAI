import { useState, useEffect, useCallback } from 'react'
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa'
import type { FindReplaceProps, FindReplaceOptions, FindReplaceMatch } from '../types'
import '../styles/MarkdownDialogsExtra.css'

function findAllMatches(text: string, search: string, opts: FindReplaceOptions): FindReplaceMatch[] {
  if (!search) return []
  
  let searchRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  if (opts.matchWholeWord) {
    searchRegex = `\\b${searchRegex}\\b`
  }
  
  const regex = new RegExp(searchRegex, opts.matchCase ? 'g' : 'gi')
  
  const foundMatches: FindReplaceMatch[] = []
  let match
  
  while ((match = regex.exec(text)) !== null) {
    foundMatches.push({
      index: match.index,
      length: match[0].length,
      text: match[0],
      selected: false
    })
    
    if (match.index === regex.lastIndex) regex.lastIndex++
  }
  
  return foundMatches
}

function preserveCase(original: string, replacement: string): string {
  if (original === original.toLowerCase()) return replacement.toLowerCase()
  if (original === original.toUpperCase()) return replacement.toUpperCase()
  if (original[0] === original[0].toUpperCase() && 
      original.slice(1) === original.slice(1).toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase()
  }
  return replacement
}

export default function FindReplace({ isOpen, onClose, onFindReplace, onHighlightMatches, content }: FindReplaceProps) {
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matches, setMatches] = useState<FindReplaceMatch[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<FindReplaceOptions>({
    matchCase: false,
    matchWholeWord: false,
    preserveCase: false
  })
  
  useEffect(() => {
    if (!findText.trim()) {
      setMatches([])
      onHighlightMatches([])
      return
    }

    const newMatches = findAllMatches(content, findText, options)
    setMatches(newMatches)
    onHighlightMatches(newMatches)
    setCurrentIndex(newMatches.length > 0 ? 0 : -1)
  }, [findText, content, options, onHighlightMatches])

  useEffect(() => {
    if (matches.length === 0) return
    
    const updatedMatches = matches.map((match, index) => ({
      ...match,
      selected: index === currentIndex
    }))
    
    onHighlightMatches(updatedMatches)
  }, [currentIndex, matches, onHighlightMatches])
  
  const replaceCurrentMatch = useCallback(() => {
    if (matches.length === 0 || currentIndex < 0) return
    
    const match = matches[currentIndex]
    let replacement = replaceText
    
    if (options.preserveCase) {
      replacement = preserveCase(match.text, replaceText)
    }
    
    onFindReplace(findText, replacement, false, options)
    
    const nextIndex = currentIndex < matches.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(nextIndex)
  }, [matches, currentIndex, replaceText, findText, options, onFindReplace])
  
  const replaceAllMatches = useCallback(() => {
    if (matches.length === 0) return
    onFindReplace(findText, replaceText, true, options)
  }, [matches, findText, replaceText, options, onFindReplace])
  
  const prevMatch = useCallback(() => {
    if (matches.length === 0) return
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : matches.length - 1
    setCurrentIndex(prevIndex)
  }, [matches, currentIndex])
  
  const nextMatch = useCallback(() => {
    if (matches.length === 0) return
    const nextIndex = currentIndex < matches.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(nextIndex)
  }, [matches, currentIndex])
  
  const toggleOption = useCallback((option: keyof FindReplaceOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }, [])
  
  if (!isOpen) return null
  

  return (
    <div className="find-replace-dialog">
      <div className="dialog-header">
        Find and Replace
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
      </div>
      
      <div className="dialog-content">
        <div className="input-group">
          <label>
            Find:
            <input
              type="text"
              value={findText}
              onChange={e => setFindText(e.target.value)}
              placeholder="Find text..."
              autoFocus
            />
          </label>
          
          <div className="match-navigation">
            <button 
              onClick={prevMatch} 
              disabled={matches.length === 0}
              title="Previous match"
            >
              <FaChevronUp />
            </button>
            <span className="match-count">
              {matches.length > 0 
                ? `${currentIndex + 1} of ${matches.length} matches`
                : "No matches"}
            </span>
            <button 
              onClick={nextMatch} 
              disabled={matches.length === 0}
              title="Next match"
            >
              <FaChevronDown />
            </button>
          </div>
        </div>
        
        <div className="input-group">
          <label>
            Replace with:
            <input
              type="text"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              placeholder="Replace with..."
            />
          </label>
        </div>
        
        <div className="match-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.matchCase}
              onChange={() => toggleOption('matchCase')}
            />
            Match Case
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.matchWholeWord}
              onChange={() => toggleOption('matchWholeWord')}
            />
            Match Whole Word
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.preserveCase}
              onChange={() => toggleOption('preserveCase')}
            />
            Preserve Case
          </label>
        </div>
        
        <div className="dialog-actions">
          <button 
            onClick={replaceCurrentMatch} 
            disabled={matches.length === 0}
            className="action-button replace-one"
          >
            Replace
          </button>
          
          <button 
            onClick={replaceAllMatches} 
            disabled={matches.length === 0}
            className="action-button replace-all"
          >
            Replace All ({matches.length})
          </button>
        </div>
      </div>
    </div>
  )
}