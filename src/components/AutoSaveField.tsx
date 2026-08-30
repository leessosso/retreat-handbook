import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  onSave: (next: string) => void
  placeholder?: string
  rows?: number
  id?: string
  className?: string
}

export function AutoSaveField({
  value,
  onSave,
  placeholder,
  rows = 5,
  id,
  className,
}: Props) {
  const [draft, setDraft] = useState(value)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (draft === value) return
    const t = window.setTimeout(() => onSaveRef.current(draft), 300)
    return () => window.clearTimeout(t)
  }, [draft, value])

  return (
    <textarea
      id={id}
      value={draft}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      className={className ?? 'field-area'}
    />
  )
}
