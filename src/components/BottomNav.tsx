import { NavLink, useLocation } from 'react-router-dom'
import { BookOpen, CalendarDays, StickyNote, UserRound } from 'lucide-react'
import { useHandbook } from '../data/HandbookProvider'

export function BottomNav() {
  const handbook = useHandbook()
  const { pathname } = useLocation()
  const firstDay = handbook.days[0]?.dayNumber ?? 1

  const items = [
    { to: '/', label: '일정', icon: CalendarDays, end: true },
    { to: '/profile', label: '소개', icon: UserRound, end: false },
    { to: `/day/${firstDay}`, label: '하루', icon: BookOpen, end: false, prefix: '/day' },
    { to: '/notes', label: '메모', icon: StickyNote, end: false },
  ] as const

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => {
              const active = 'prefix' in item ? pathname.startsWith(item.prefix) : isActive
              return `nav-item${active ? ' active' : ''}`
            }}
          >
            <Icon size={20} strokeWidth={1.7} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
