import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = {
  passage: string
  text: string
}

export function ScriptureAccordion({ passage, text }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="scripture">
      <button
        type="button"
        className="scripture-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>본문 · {passage}</span>
        <ChevronDown className={`chev ${open ? 'open' : ''}`} size={18} strokeWidth={1.75} />
      </button>
      {open ? (
        <div className="scripture-body">
          {text.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : null}
    </div>
  )
}
