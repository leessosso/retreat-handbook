import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseHandbook, type HandbookData } from './handbook'
import { loadHandbook } from '../lib/remoteHandbook'
import { PREVIEW_STORAGE_KEY } from '../lib/handbookEdit'

type HandbookContextValue = {
  handbook: HandbookData
  published: HandbookData
  isPreview: boolean
  applyPreview: (data: HandbookData) => void
  clearPreview: () => void
  markPublished: (data: HandbookData) => void
}

const HandbookContext = createContext<HandbookContextValue | null>(null)

function readStoredPreview(): HandbookData | null {
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY)
    if (!raw) return null
    return parseHandbook(JSON.parse(raw) as unknown)
  } catch {
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY)
    return null
  }
}

export function HandbookProvider({ children }: { children: ReactNode }) {
  const [published, setPublished] = useState<HandbookData | null>(null)
  const [preview, setPreview] = useState<HandbookData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadHandbook()
      .then((data) => {
        if (cancelled) return
        setPublished(data)
        setPreview(readStoredPreview())
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '핸드북 데이터를 읽지 못했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handbook = preview ?? published
  const isPreview = preview !== null

  useEffect(() => {
    if (!handbook) return
    document.title = `${handbook.title} — ${handbook.subtitle}`
  }, [handbook])

  const value = useMemo(() => {
    if (!published || !handbook) return null
    return {
      handbook,
      published,
      isPreview,
      applyPreview: (data: HandbookData) => {
        const next = parseHandbook(data)
        sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(next))
        setPreview(next)
      },
      clearPreview: () => {
        sessionStorage.removeItem(PREVIEW_STORAGE_KEY)
        setPreview(null)
      },
      markPublished: (data: HandbookData) => {
        const next = parseHandbook(data)
        sessionStorage.removeItem(PREVIEW_STORAGE_KEY)
        setPreview(null)
        setPublished(next)
      },
    }
  }, [handbook, published, isPreview])

  if (error) {
    return (
      <div className="boot">
        <p>핸드북 내용을 불러오지 못했어요.</p>
        <p className="boot-detail">{error}</p>
        <p className="boot-detail">네트워크를 확인하거나, 잠시 후 다시 열어 주세요.</p>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="boot">
        <p>핸드북을 불러오는 중…</p>
      </div>
    )
  }

  return <HandbookContext.Provider value={value}>{children}</HandbookContext.Provider>
}

export function useHandbookContext() {
  const ctx = useContext(HandbookContext)
  if (!ctx) throw new Error('HandbookProvider 안에서만 쓸 수 있습니다.')
  return ctx
}

export function useHandbook() {
  return useHandbookContext().handbook
}
