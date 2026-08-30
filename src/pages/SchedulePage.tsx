import { useRef, useState } from 'react'
import { audienceLabel } from '../data/handbook'
import { useHandbook } from '../data/HandbookProvider'

export function SchedulePage() {
  const handbook = useHandbook()
  const [index, setIndex] = useState(0)
  const touch = useRef({ x: 0, y: 0 })
  const last = handbook.schedule.length - 1
  const block = handbook.schedule[index]

  function go(i: number) {
    if (i < 0 || i > last) return
    setIndex(i)
  }

  return (
    <div className="page">
      <h2 className="page-title">전체 일정</h2>
      <p className="theme-verse">
        {handbook.themeVerse.passage} · {handbook.themeVerse.text}
      </p>
      <p className="page-lead">숙박은 새벽까지, 출퇴근은 저녁 나눔 뒤에 돌아가요.</p>

      <div className="day-chips" role="tablist" aria-label="일차">
        {handbook.schedule.map((item, i) => (
          <button
            key={item.day}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`chip${i === index ? ' on' : ''}`}
            onClick={() => go(i)}
          >
            {i + 1}일
          </button>
        ))}
      </div>

      {block ? (
        <article
          className="schedule-day"
          onTouchStart={(e) => {
            touch.current = {
              x: e.changedTouches[0].clientX,
              y: e.changedTouches[0].clientY,
            }
          }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touch.current.x
            const dy = e.changedTouches[0].clientY - touch.current.y
            if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
            go(index + (dx < 0 ? 1 : -1))
          }}
        >
          <div className="schedule-head">
            <h3>{block.day}</h3>
            <time>{block.date}</time>
          </div>
          <ul className="timeline">
            {block.events.map((ev) => (
              <li key={`${block.day}-${ev.time}-${ev.title}`}>
                <span className="time">{ev.time}</span>
                <div>
                  <p className="event-title">{ev.title}</p>
                  {ev.audience ? <span className="aud">{audienceLabel[ev.audience]}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  )
}
