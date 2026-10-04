import { beforeEach, describe, expect, it } from 'vitest'
import { addRecent, loadRecent, MAX_RECENT, removeRecent, type RecentItem } from './history'
import { defaultStyle } from './style'

const item = (n: number, url = `a${n}.com`): RecentItem => ({
  id: `id${n}`, type: 'url', fields: { url }, style: defaultStyle, label: url, at: n,
})

describe('recent history', () => {
  beforeEach(() => localStorage.clear())

  it('survives a reload', () => {
    addRecent([], item(1))
    expect(loadRecent().map(i => i.id)).toEqual(['id1'])
  })

  it('puts newest first and dedupes identical codes', () => {
    let l = addRecent([], item(1, 'x.com'))
    l = addRecent(l, item(2, 'y.com'))
    l = addRecent(l, item(3, 'x.com'))
    expect(l.map(i => i.id)).toEqual(['id3', 'id2'])
  })

  it('caps the list', () => {
    let l: RecentItem[] = []
    for (let i = 0; i < MAX_RECENT + 5; i++) l = addRecent(l, item(i))
    expect(loadRecent()).toHaveLength(MAX_RECENT)
  })

  it('removes entries', () => {
    const l = addRecent(addRecent([], item(1)), item(2))
    removeRecent(l, 'id1')
    expect(loadRecent().map(i => i.id)).toEqual(['id2'])
  })

  it('ignores corrupt storage', () => {
    localStorage.setItem('qr-studio:recent', '{not json')
    expect(loadRecent()).toEqual([])
    localStorage.setItem('qr-studio:recent', '[null, 3, {"id": 1}]')
    expect(loadRecent()).toEqual([])
  })
})
