import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { HeaderBanner } from './components/HeaderBanner'
import { PreviewBanner } from './components/PreviewBanner'
import { HandbookProvider, useHandbook } from './data/HandbookProvider'
import { AdminPage } from './pages/AdminPage'
import { DayPage } from './pages/DayPage'
import { NotesPage } from './pages/NotesPage'
import { ProfilePage } from './pages/ProfilePage'
import { SchedulePage } from './pages/SchedulePage'

function routerBasename() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return base === '' ? '/' : base
}

function Shell() {
  const handbook = useHandbook()
  const { pathname } = useLocation()
  const isAdmin = pathname === '/admin'
  const firstDay = handbook.days[0]?.dayNumber ?? 1

  return (
    <div className={isAdmin ? 'shell shell-admin' : 'shell'}>
      {isAdmin ? null : <HeaderBanner />}
      {isAdmin ? null : <PreviewBanner />}
      <main className="main">
        <Routes>
          <Route path="/" element={<SchedulePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/day/:n" element={<DayPage />} />
          <Route path="/day" element={<Navigate to={`/day/${firstDay}`} replace />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isAdmin ? null : <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <HandbookProvider>
        <Shell />
      </HandbookProvider>
    </BrowserRouter>
  )
}
