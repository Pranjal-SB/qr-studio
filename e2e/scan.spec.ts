import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

async function downloadAndDecode(page: Page) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG' }).click()])
  const png = PNG.sync.read(readFileSync(await dl.path()))
  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
  return { text: code?.data, width: png.width }
}

const cases: { tab: string; fill: (p: Page) => Promise<void>; expected: string }[] = [
  { tab: 'Link', fill: p => p.getByLabel('Link').fill('gdgsrm.com/join'), expected: 'https://gdgsrm.com/join' },
  { tab: 'Text', fill: p => p.getByLabel(/^Text/).fill('Hello from GDG'), expected: 'Hello from GDG' },
  {
    tab: 'Email',
    fill: async p => { await p.getByLabel('Send to').fill('technical@gdgsrm.com'); await p.getByLabel(/^Subject/).fill('Task') },
    expected: 'mailto:technical@gdgsrm.com?subject=Task',
  },
  { tab: 'Phone', fill: p => p.getByLabel('Phone number').fill('+91 98765 43210'), expected: 'tel:+919876543210' },
  {
    tab: 'Wi-Fi',
    fill: async p => { await p.getByLabel('Network name').fill('Lab;5G'); await p.getByLabel('Password').fill('hunter2hunter2') },
    expected: String.raw`WIFI:T:WPA;S:Lab\;5G;P:hunter2hunter2;;`,
  },
]

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

for (const c of cases) {
  test(`downloaded ${c.tab} code scans back to its payload`, async ({ page }) => {
    await page.getByRole('tab', { name: c.tab }).click()
    await c.fill(page)
    const { text } = await downloadAndDecode(page)
    expect(text).toBe(c.expected)
  })
}

test('every preset still scans, and download matches chosen size', async ({ page }) => {
  await page.getByLabel('Link').fill('example.com')
  for (const name of ['Parchment', 'Sage', 'Dusk', 'Ember', 'Slate']) {
    await page.getByRole('button', { name, exact: true }).click()
    const { text, width } = await downloadAndDecode(page)
    expect(text, name).toBe('https://example.com/')
    expect(width).toBe(320)
  }
})

test('preview canvas is the same image as the PNG download', async ({ page }) => {
  await page.getByLabel('Link').fill('example.com')
  await page.getByRole('button', { name: 'Sage' }).click()
  const preview = await page.locator('[data-testid=qr] canvas').evaluate(c => (c as HTMLCanvasElement).toDataURL('image/png'))
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG' }).click()])
  const a = PNG.sync.read(Buffer.from(preview.split(',')[1], 'base64'))
  const b = PNG.sync.read(readFileSync(await dl.path()))
  expect([a.width, a.height]).toEqual([b.width, b.height])
  expect(Buffer.compare(a.data, b.data)).toBe(0)
})

test('recent codes persist across reload and can be reused', async ({ page }) => {
  await page.getByRole('tab', { name: 'Text' }).click()
  await page.getByLabel(/^Text/).fill('keep me')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: /^Text\s*keep me/ }).click()
  await expect(page.getByLabel(/^Text/)).toHaveValue('keep me')
})

test('invalid input shows an error and disables download', async ({ page }) => {
  await page.getByLabel('Link').fill('not a url')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
})

test('no horizontal overflow', async ({ page }) => {
  await page.getByLabel('Link').fill('example.com')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
