export type QrType = 'url' | 'text' | 'email' | 'phone' | 'wifi'

export type Fields = {
  url: { url: string }
  text: { text: string }
  email: { to: string; subject: string; body: string }
  phone: { number: string }
  wifi: { ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean }
}

export type AnyFields = { [K in QrType]: Fields[K] }

export const emptyFields: AnyFields = {
  url: { url: '' },
  text: { text: '' },
  email: { to: '', subject: '', body: '' },
  phone: { number: '' },
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
}

// Byte-mode capacity of a version 40 code at level L is 2953; leave headroom
// for the higher correction levels the user can pick.
export const MAX_TEXT = 1200

export type Result = { ok: true; data: string } | { ok: false; errors: Record<string, string> }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{5,18}[0-9]$/

function wifiEscape(s: string) {
  return s.replace(/([\\;,:"])/g, '\\$1')
}

export function buildPayload<K extends QrType>(type: K, f: Fields[K]): Result {
  const errors: Record<string, string> = {}
  let data = ''

  switch (type) {
    case 'url': {
      const raw = (f as Fields['url']).url.trim()
      if (!raw) { errors.url = 'Enter a link.'; break }
      const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
      try {
        const u = new URL(withScheme)
        if (!['http:', 'https:'].includes(u.protocol)) errors.url = 'Links must start with http:// or https://.'
        else if (!u.hostname.includes('.') && u.hostname !== 'localhost') errors.url = 'That address has no domain, like example.com.'
        else data = u.href
      } catch {
        errors.url = 'That is not a valid link.'
      }
      break
    }
    case 'text': {
      const t = (f as Fields['text']).text
      if (!t.trim()) errors.text = 'Enter some text.'
      else if (t.length > MAX_TEXT) errors.text = `Keep it under ${MAX_TEXT} characters. Long codes get too dense to scan.`
      else data = t
      break
    }
    case 'email': {
      const e = f as Fields['email']
      const to = e.to.trim()
      if (!to) errors.to = 'Enter an email address.'
      else if (!EMAIL_RE.test(to)) errors.to = 'That email address is missing something, like name@example.com.'
      if (e.subject.length + e.body.length > MAX_TEXT) errors.body = 'Subject and message are too long for one code.'
      if (Object.keys(errors).length) break
      const q = new URLSearchParams()
      if (e.subject) q.set('subject', e.subject)
      if (e.body) q.set('body', e.body)
      const qs = q.toString().replace(/\+/g, '%20')
      data = `mailto:${to}${qs ? `?${qs}` : ''}`
      break
    }
    case 'phone': {
      const n = (f as Fields['phone']).number.trim()
      if (!n) errors.number = 'Enter a phone number.'
      else if (!PHONE_RE.test(n)) errors.number = 'Use digits only, with an optional + and country code.'
      else data = `tel:${n.replace(/[\s\-().]/g, '')}`
      break
    }
    case 'wifi': {
      const w = f as Fields['wifi']
      if (!w.ssid.trim()) errors.ssid = 'Enter the network name.'
      else if (new TextEncoder().encode(w.ssid).length > 32) errors.ssid = 'Network names are at most 32 bytes.'
      if (w.security === 'WPA' && (w.password.length < 8 || w.password.length > 63))
        errors.password = 'WPA passwords are 8 to 63 characters.'
      if (w.security === 'WEP' && ![5, 13, 16].includes(w.password.length) && !/^([0-9a-f]{10}|[0-9a-f]{26}|[0-9a-f]{32})$/i.test(w.password))
        errors.password = 'WEP keys are 5, 13 or 16 characters, or 10, 26 or 32 hex digits.'
      if (Object.keys(errors).length) break
      const p = w.security === 'nopass' ? '' : `P:${wifiEscape(w.password)};`
      data = `WIFI:T:${w.security};S:${wifiEscape(w.ssid)};${p}${w.hidden ? 'H:true;' : ''};`
      break
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data }
}

export function summarize(type: QrType, f: Fields[QrType]): string {
  switch (type) {
    case 'url': return (f as Fields['url']).url
    case 'text': return (f as Fields['text']).text.slice(0, 60)
    case 'email': return (f as Fields['email']).to
    case 'phone': return (f as Fields['phone']).number
    case 'wifi': return (f as Fields['wifi']).ssid
  }
}
