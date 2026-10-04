import { describe, expect, it } from 'vitest'
import { contrast, defaultStyle, readabilityWarnings } from './style'

describe('contrast', () => {
  it('matches WCAG for black on white', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
})

describe('readabilityWarnings', () => {
  it('is quiet for the defaults', () => {
    expect(readabilityWarnings(defaultStyle)).toEqual([])
  })
  it('flags low contrast', () => {
    expect(readabilityWarnings({ ...defaultStyle, fg: '#dddddd' }).join()).toMatch(/Low contrast/)
  })
  it('checks both gradient stops', () => {
    const w = readabilityWarnings({ ...defaultStyle, gradient: true, fg: '#000000', fg2: '#eeeeee' })
    expect(w.join()).toMatch(/Low contrast/)
  })
  it('flags inverted codes', () => {
    expect(readabilityWarnings({ ...defaultStyle, fg: '#ffffff', bg: '#000000' }).join()).toMatch(/inverted/)
  })
  it('flags small margin and size', () => {
    const w = readabilityWarnings({ ...defaultStyle, margin: 0, size: 120 }).join()
    expect(w).toMatch(/margin/)
    expect(w).toMatch(/Small size/)
  })
  it('flags a logo on low error correction only', () => {
    expect(readabilityWarnings({ ...defaultStyle, logo: 'data:x', ecl: 'M' }).join()).toMatch(/logo/)
    expect(readabilityWarnings({ ...defaultStyle, logo: 'data:x', ecl: 'H' })).toEqual([])
  })
})
