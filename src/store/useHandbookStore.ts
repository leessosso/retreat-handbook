import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { emptyProfile, STORAGE_VERSION, type Profile } from './types'

type HandbookState = {
  storageVersion: number
  profile: Profile
  sermons: Record<string, string>
  sharing: Record<string, string>
  setProfile: (profile: Profile) => void
  setSermon: (sessionId: string, text: string) => void
  setSharing: (questionId: string, text: string) => void
}

export const useHandbookStore = create<HandbookState>()(
  persist(
    (set) => ({
      storageVersion: STORAGE_VERSION,
      profile: emptyProfile,
      sermons: {},
      sharing: {},
      setProfile: (profile) => set({ profile }),
      setSermon: (sessionId, text) =>
        set((s) => ({ sermons: { ...s.sermons, [sessionId]: text } })),
      setSharing: (questionId, text) =>
        set((s) => ({ sharing: { ...s.sharing, [questionId]: text } })),
    }),
    { name: 'retreat-handbook-v1' },
  ),
)
