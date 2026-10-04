import type { QrType, Fields } from './payload'
import type { QrStyle } from './style'

export type RecentItem = {
  id: string
  type: QrType
  fields: Fields[QrType]
  style: QrStyle
  label: string
  at: number
}

const KEY = 'qr-studio:recent'
export const MAX_RECENT = 12

export function loadRecent(storage: Storage = localStorage): RecentItem[] {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(i => i && typeof i.id === 'string' && i.type && i.style) : []
  } catch {
    return []
  }
}

function sameCode(a: RecentItem, b: RecentItem) {
  return a.type === b.type
    && JSON.stringify(a.fields) === JSON.stringify(b.fields)
    && JSON.stringify(a.style) === JSON.stringify(b.style)
}

// Returns the new list; writes are best effort because a large logo data URL
// can blow the storage quota.
export function addRecent(list: RecentItem[], item: RecentItem, storage: Storage = localStorage): RecentItem[] {
  const next = [item, ...list.filter(i => !sameCode(i, item))].slice(0, MAX_RECENT)
  save(next, storage)
  return next
}

export function removeRecent(list: RecentItem[], id: string, storage: Storage = localStorage): RecentItem[] {
  const next = list.filter(i => i.id !== id)
  save(next, storage)
  return next
}

function save(list: RecentItem[], storage: Storage) {
  try {
    storage.setItem(KEY, JSON.stringify(list))
  } catch {
    try {
      storage.setItem(KEY, JSON.stringify(list.map(i => ({ ...i, style: { ...i.style, logo: null } }))))
    } catch { /* storage unavailable, keep in-memory list */ }
  }
}
