// Regenerates README screenshots: npx vite preview --port 4173 & node --experimental-strip-types e2e/screenshots.ts
import { chromium, devices } from '@playwright/test'

const url = 'http://localhost:4173'
const b = await chromium.launch()

async function shot(name: string, opts: Parameters<typeof b.newContext>[0], prep: (p: import('@playwright/test').Page) => Promise<void>) {
  const ctx = await b.newContext(opts)
  const p = await ctx.newPage()
  await p.goto(url)
  await prep(p)
  await p.waitForTimeout(400)
  await p.screenshot({ path: `screenshots/${name}.png`, fullPage: true })
  await ctx.close()
}

await shot('desktop', { viewport: { width: 1360, height: 900 } }, async p => {
  await p.getByLabel('Link').fill('gdgsrm.com/recruitments')
  await p.getByRole('button', { name: 'Sage' }).click()
  await p.getByRole('button', { name: 'Save', exact: true }).click()
})
await shot('wifi-dark', { viewport: { width: 1360, height: 900 }, colorScheme: 'dark' }, async p => {
  await p.getByRole('tab', { name: 'Wi-Fi' }).click()
  await p.getByLabel('Network name').fill('GDG Lab')
  await p.getByLabel('Password').fill('buildwithgoogle')
  await p.getByRole('button', { name: 'Ember' }).click()
})
await shot('warnings', { viewport: { width: 1360, height: 900 } }, async p => {
  await p.getByLabel('Link').fill('example.com')
  await p.locator('input[type=color]').nth(0).fill('#d0d4dc')
  await p.getByLabel('Margin').fill('2')
})
await shot('mobile', { ...devices['Pixel 7'] }, async p => {
  await p.getByRole('tab', { name: 'Email' }).click()
  await p.getByLabel('Send to').fill('technical@gdgsrm.com')
  await p.getByRole('button', { name: 'Dusk' }).click()
})
await shot('error', { ...devices['Pixel 7'] }, async p => {
  await p.getByRole('tab', { name: 'Phone' }).click()
  await p.getByLabel('Phone number').fill('call me')
})
await b.close()
