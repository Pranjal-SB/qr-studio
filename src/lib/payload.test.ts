import { describe, expect, it } from 'vitest'
import { buildPayload, MAX_TEXT } from './payload'

const ok = (r: ReturnType<typeof buildPayload>) => (r.ok ? r.data : `ERR ${JSON.stringify(r.errors)}`)

describe('url', () => {
  it('adds https when scheme is missing', () => {
    expect(ok(buildPayload('url', { url: 'example.com/menu' }))).toBe('https://example.com/menu')
  })
  it('keeps an explicit http scheme', () => {
    expect(ok(buildPayload('url', { url: 'http://a.io' }))).toBe('http://a.io/')
  })
  it.each(['', '   ', 'ftp://a.com', 'javascript:alert(1)', 'nodomain', 'http://'])('rejects %j', url => {
    const r = buildPayload('url', { url })
    expect(r.ok).toBe(false)
  })
})

describe('text', () => {
  it('passes text through untouched', () => {
    expect(ok(buildPayload('text', { text: '  hi there ' }))).toBe('  hi there ')
  })
  it('rejects empty and oversized text', () => {
    expect(buildPayload('text', { text: ' ' }).ok).toBe(false)
    expect(buildPayload('text', { text: 'a'.repeat(MAX_TEXT + 1) }).ok).toBe(false)
  })
})

describe('email', () => {
  it('builds a mailto with encoded subject and body', () => {
    const r = buildPayload('email', { to: 'a@b.co', subject: 'Hi there', body: 'x&y=z' })
    expect(ok(r)).toBe('mailto:a@b.co?subject=Hi%20there&body=x%26y%3Dz')
  })
  it('omits the query when subject and body are empty', () => {
    expect(ok(buildPayload('email', { to: 'a@b.co', subject: '', body: '' }))).toBe('mailto:a@b.co')
  })
  it.each(['', 'a@b', 'a b@c.com', '@c.com'])('rejects address %j', to => {
    const r = buildPayload('email', { to, subject: '', body: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.to).toBeTruthy()
  })
})

describe('phone', () => {
  it('strips formatting', () => {
    expect(ok(buildPayload('phone', { number: '+91 (987) 654-3210' }))).toBe('tel:+919876543210')
  })
  it.each(['', '12', 'call me', '+91 98765 4321a'])('rejects %j', number => {
    expect(buildPayload('phone', { number }).ok).toBe(false)
  })
})

describe('wifi', () => {
  it('escapes special characters', () => {
    const r = buildPayload('wifi', { ssid: 'Cafe;Free', password: 'p:ss,word"\\', security: 'WPA', hidden: false })
    expect(ok(r)).toBe('WIFI:T:WPA;S:Cafe\\;Free;P:p\\:ss\\,word\\"\\\\;;')
  })
  it('drops the password for open networks and marks hidden ones', () => {
    const r = buildPayload('wifi', { ssid: 'Lobby', password: 'ignored', security: 'nopass', hidden: true })
    expect(ok(r)).toBe('WIFI:T:nopass;S:Lobby;H:true;;')
  })
  it('enforces WPA password length', () => {
    const r = buildPayload('wifi', { ssid: 'x', password: 'short', security: 'WPA', hidden: false })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.password).toMatch(/8 to 63/)
  })
  it('accepts valid WEP keys only', () => {
    expect(buildPayload('wifi', { ssid: 'x', password: 'abcde', security: 'WEP', hidden: false }).ok).toBe(true)
    expect(buildPayload('wifi', { ssid: 'x', password: '0123456789', security: 'WEP', hidden: false }).ok).toBe(true)
    expect(buildPayload('wifi', { ssid: 'x', password: 'abcdef', security: 'WEP', hidden: false }).ok).toBe(false)
  })
  it('requires an ssid', () => {
    expect(buildPayload('wifi', { ssid: '', password: '', security: 'nopass', hidden: false }).ok).toBe(false)
  })
})
