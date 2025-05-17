import type { CheatSheetProps } from '../types'

export default function CheatSheet({ isOpen, onClose, cheatSheetData }: CheatSheetProps) {
  if (!isOpen) return null

  return (
    <div className="cheat-sheet">
      <div className="cheat-sheet-header">
        Markdown Cheat Sheet
        <button onClick={onClose}>&times;</button>
      </div>
      <div className="cheat-sheet-content">
        {Object.entries(cheatSheetData).map(([category, items]) => (
          <section key={category}>
            <h3>{category}</h3>
            <div className="cheat-sheet-grid">
              {Object.entries(items).map(([syntax, description]) => (
                <div key={syntax} className="cheat-item">
                  <pre><code>{syntax}</code></pre>
                  <span>{description}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
} 