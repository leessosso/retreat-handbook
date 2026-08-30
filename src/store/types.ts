export type Profile = {
  name: string
  age: string
  group: string
  mbti: string
  vibe: string
  hobby: string
  song: string
  verse: string
  grace: string
  word: string
  strengths: [string, string, string]
  weaknesses: [string, string, string]
  tags: string
  hope: string
  prayer: string
}

export const emptyProfile: Profile = {
  name: '',
  age: '',
  group: '',
  mbti: '',
  vibe: '',
  hobby: '',
  song: '',
  verse: '',
  grace: '',
  word: '',
  strengths: ['', '', ''],
  weaknesses: ['', '', ''],
  tags: '',
  hope: '',
  prayer: '',
}

export const STORAGE_VERSION = 1
