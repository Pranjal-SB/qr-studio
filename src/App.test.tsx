import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// jsdom has no canvas; rendering is covered by the Playwright scan test.
vi.mock('qr-code-styling', () => ({
  default: class {
    append() {}
    update() {}
    async getRawData() { return new Blob(['png'], { type: 'image/png' }) }
  },
}))

beforeEach(() => {
  localStorage.clear()
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never
  URL.createObjectURL = vi.fn(() => 'blob:x')
  URL.revokeObjectURL = vi.fn()
})

describe('App', () => {
  it('shows inputs that match the selected type', async () => {
    const u = userEvent.setup()
    render(<App />)
    expect(screen.getByLabelText('Link')).toBeInTheDocument()
    await u.click(screen.getByRole('tab', { name: 'Wi-Fi' }))
    expect(screen.getByLabelText('Network name')).toBeInTheDocument()
    await u.selectOptions(screen.getByLabelText('Security'), 'nopass')
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    await u.click(screen.getByRole('tab', { name: 'Email' }))
    expect(screen.getByLabelText('Send to')).toBeInTheDocument()
  })

  it('shows validation errors and blocks download', async () => {
    const u = userEvent.setup()
    render(<App />)
    await u.type(screen.getByLabelText('Link'), 'ftp://x.com')
    expect(screen.getByRole('alert')).toHaveTextContent(/http/)
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
  })

  it('renders a preview for valid input and stores it on download', async () => {
    const u = userEvent.setup()
    render(<App />)
    await u.type(screen.getByLabelText('Link'), 'example.com')
    expect(screen.getByTestId('qr')).toHaveAttribute('aria-label', 'QR code for https://example.com/')
    await u.click(screen.getByRole('button', { name: 'Download PNG' }))
    expect(await screen.findByText('Downloaded PNG.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('qr-studio:recent')!)[0].label).toBe('example.com')
  })

  it('restores a recent code after reload', async () => {
    const u = userEvent.setup()
    const { unmount } = render(<App />)
    await u.click(screen.getByRole('tab', { name: 'Phone' }))
    await u.type(screen.getByLabelText('Phone number'), '+91 98765 43210')
    await u.click(screen.getByRole('button', { name: 'Save' }))
    unmount()

    render(<App />)
    await u.click(screen.getByRole('button', { name: /^Phone/ }))
    expect(screen.getByLabelText('Phone number')).toHaveValue('+91 98765 43210')
  })

  it('applies a preset and still lets the user edit it', async () => {
    const u = userEvent.setup()
    render(<App />)
    await u.type(screen.getByLabelText('Link'), 'example.com')
    await u.click(screen.getByRole('button', { name: 'Sage' }))
    expect(screen.getByLabelText('Gradient fill')).toBeChecked()
    await u.click(screen.getByLabelText('Gradient fill'))
    expect(screen.getByLabelText('Gradient fill')).not.toBeChecked()
  })

  it('warns about unreadable choices', async () => {
    const u = userEvent.setup()
    render(<App />)
    await u.type(screen.getByLabelText('Link'), 'example.com')
    await u.selectOptions(screen.getByLabelText(/^Error correction/), 'L')
    await u.selectOptions(screen.getByLabelText('Module shape'), 'dots')
    expect(screen.getByText(/older scanners/)).toBeInTheDocument()
  })
})
