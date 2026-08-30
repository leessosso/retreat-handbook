import { parseHandbook, type HandbookData } from '../data/handbook'

function supabaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ?? ''
}

function supabaseKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
}

export function isRemoteConfigured() {
  return Boolean(supabaseUrl() && supabaseKey())
}

function headers() {
  const key = supabaseKey()
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

export async function fetchRemoteHandbook(): Promise<HandbookData | null> {
  if (!isRemoteConfigured()) return null
  const res = await fetch(`${supabaseUrl()}/rest/v1/handbook?id=eq.current&select=payload`, {
    headers: {
      ...headers(),
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const rows = (await res.json()) as Array<{ payload?: unknown }>
  const payload = rows[0]?.payload
  if (payload == null) return null
  return parseHandbook(payload)
}

export async function saveRemoteHandbook(data: HandbookData) {
  if (!isRemoteConfigured()) {
    throw new Error('올해 클라우드 저장이 아직 연결되지 않았습니다.')
  }
  const res = await fetch(`${supabaseUrl()}/rest/v1/handbook`, {
    method: 'POST',
    headers: {
      ...headers(),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ id: 'current', payload: data }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || '저장에 실패했습니다.')
  }
}

export async function loadHandbook(): Promise<HandbookData> {
  try {
    const remote = await fetchRemoteHandbook()
    if (remote) return remote
  } catch {
    // 클라우드가 비어 있거나 잠시 안 되면 기본 파일을 씁니다.
  }
  const url = `${import.meta.env.BASE_URL}handbook.json`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('핸드북 기본 파일을 불러오지 못했습니다.')
  return parseHandbook(await res.json())
}