import { useState } from 'react'
import { Copy, Share2 } from 'lucide-react'
import { formatExportText } from '../lib/exportNotes'
import { useHandbook } from '../data/HandbookProvider'
import { useHandbookStore } from '../store/useHandbookStore'

export function NotesPage() {
  const handbook = useHandbook()
  const profile = useHandbookStore((s) => s.profile)
  const sermons = useHandbookStore((s) => s.sermons)
  const sharing = useHandbookStore((s) => s.sharing)
  const [status, setStatus] = useState('')

  const text = formatExportText({ handbook, profile, sermons, sharing })
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('클립보드에 복사했습니다.')
    } catch {
      setStatus('복사에 실패했습니다. 아래에서 직접 선택해 주세요.')
    }
  }

  async function shareAll() {
    try {
      await navigator.share({
        title: `${handbook.title} 메모`,
        text,
      })
      setStatus('공유 창을 열었습니다.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setStatus('공유를 사용할 수 없어 복사로 대체합니다.')
      await copyAll()
    }
  }

  const entries = handbook.days.flatMap((day) => {
    const sermonNotes = day.sessions
      .map((s) => ({
        key: s.id,
        heading: `${day.dayNumber}일차 · ${s.type} · ${s.title}`,
        body: sermons[s.id]?.trim() ?? '',
      }))
      .filter((x) => x.body)
    const answers = day.sharingQuestions
      .map((q, i) => ({
        key: q.id,
        heading: `${day.dayNumber}일차 나눔 ${i + 1}`,
        body: sharing[q.id]?.trim() ?? '',
      }))
      .filter((x) => x.body)
    return [...sermonNotes, ...answers]
  })

  return (
    <div className="page">
      <h2 className="page-title">나의 메모</h2>
      <p className="page-lead">이 브라우저에만 남아요. 다른 폰이면 복사해서 가져가세요.</p>

      <div className="export-row">
        <button type="button" className="btn" onClick={copyAll}>
          <Copy size={16} strokeWidth={1.8} />
          텍스트 복사
        </button>
        {canShare ? (
          <button type="button" className="btn ghost" onClick={shareAll}>
            <Share2 size={16} strokeWidth={1.8} />
            공유
          </button>
        ) : null}
      </div>
      {status ? <p className="status">{status}</p> : null}

      {entries.length === 0 ? (
        <p className="empty">아직 적은 설교 메모나 나눔이 없습니다.</p>
      ) : (
        <ul className="notes-list">
          {entries.map((item) => (
            <li key={item.key} className="paper">
              <h3 className="section-label">{item.heading}</h3>
              <p className="note-body">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
