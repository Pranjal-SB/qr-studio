import type { AnyFields, QrType } from '../lib/payload'
import { MAX_TEXT } from '../lib/payload'

interface Props {
  type: QrType
  fields: AnyFields
  errors: Record<string, string>
  touched: boolean
  onChange: <K extends QrType>(type: K, patch: Partial<AnyFields[K]>) => void
}

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p className="err" id={id} role="alert">{msg}</p> : null
}

export function TypeFields({ type, fields, errors, touched, onChange }: Props) {
  const e = touched ? errors : {}
  const a = (k: string) => ({ 'aria-invalid': !!e[k], 'aria-describedby': e[k] ? `err-${k}` : undefined })

  switch (type) {
    case 'url':
      return (
        <label className="field">
          <span>Link</span>
          <input type="url" inputMode="url" autoComplete="url" placeholder="example.com/menu" value={fields.url.url}
            onChange={ev => onChange('url', { url: ev.target.value })} {...a('url')} />
          <Err id="err-url" msg={e.url} />
        </label>
      )
    case 'text':
      return (
        <label className="field">
          <span>Text <small>{fields.text.text.length}/{MAX_TEXT}</small></span>
          <textarea rows={4} placeholder="Anything you want people to read" value={fields.text.text}
            onChange={ev => onChange('text', { text: ev.target.value })} {...a('text')} />
          <Err id="err-text" msg={e.text} />
        </label>
      )
    case 'email':
      return (
        <>
          <label className="field">
            <span>Send to</span>
            <input type="email" autoComplete="email" placeholder="name@example.com" value={fields.email.to}
              onChange={ev => onChange('email', { to: ev.target.value })} {...a('to')} />
            <Err id="err-to" msg={e.to} />
          </label>
          <label className="field">
            <span>Subject <small>optional</small></span>
            <input value={fields.email.subject} onChange={ev => onChange('email', { subject: ev.target.value })} />
          </label>
          <label className="field">
            <span>Message <small>optional</small></span>
            <textarea rows={3} value={fields.email.body} onChange={ev => onChange('email', { body: ev.target.value })} {...a('body')} />
            <Err id="err-body" msg={e.body} />
          </label>
        </>
      )
    case 'phone':
      return (
        <label className="field">
          <span>Phone number</span>
          <input type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={fields.phone.number}
            onChange={ev => onChange('phone', { number: ev.target.value })} {...a('number')} />
          <Err id="err-number" msg={e.number} />
        </label>
      )
    case 'wifi':
      return (
        <>
          <label className="field">
            <span>Network name</span>
            <input autoComplete="off" value={fields.wifi.ssid} onChange={ev => onChange('wifi', { ssid: ev.target.value })} {...a('ssid')} />
            <Err id="err-ssid" msg={e.ssid} />
          </label>
          <label className="field">
            <span>Security</span>
            <select value={fields.wifi.security}
              onChange={ev => onChange('wifi', { security: ev.target.value as AnyFields['wifi']['security'] })}>
              <option value="WPA">WPA / WPA2 / WPA3</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None</option>
            </select>
          </label>
          {fields.wifi.security !== 'nopass' && (
            <label className="field">
              <span>Password</span>
              <input type="text" autoComplete="off" spellCheck={false} value={fields.wifi.password}
                onChange={ev => onChange('wifi', { password: ev.target.value })} {...a('password')} />
              <Err id="err-password" msg={e.password} />
            </label>
          )}
          <label className="check">
            <input type="checkbox" checked={fields.wifi.hidden} onChange={ev => onChange('wifi', { hidden: ev.target.checked })} />
            Hidden network
          </label>
        </>
      )
  }
}
