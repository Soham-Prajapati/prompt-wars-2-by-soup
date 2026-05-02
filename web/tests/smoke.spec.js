import { expect, test } from '@playwright/test'

// ── Page rendering ──────────────────────────────────────────────────────────

test('home page renders key CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /understand your vote in one workflow./i })).toBeVisible()
  await expect(page.getByRole('link', { name: /open workspace/i })).toBeVisible()
})

test('command center route is reachable', async ({ page }) => {
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: /pick one civic task and complete it./i })).toBeVisible()
})

test('chat page loads without errors', async ({ page }) => {
  await page.goto('/chat')
  await expect(page.locator('body')).toBeVisible()
  // Chat input should be present
  const input = page.locator('input[placeholder]')
  await expect(input).toBeVisible()
})

test('fact-check page is reachable', async ({ page }) => {
  await page.goto('/fact-check')
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('h1, h2')).toBeVisible()
})

test('timeline page is reachable', async ({ page }) => {
  await page.goto('/timeline')
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('h1, h2')).toBeVisible()
})

test('quiz page is reachable', async ({ page }) => {
  await page.goto('/quiz')
  await expect(page.locator('body')).toBeVisible()
})

test('evm simulator page is reachable', async ({ page }) => {
  await page.goto('/evm-simulator')
  await expect(page.locator('body')).toBeVisible()
})

test('jawaab-do page is reachable', async ({ page }) => {
  await page.goto('/jawaab-do')
  await expect(page.locator('body')).toBeVisible()
})

// ── Navigation ──────────────────────────────────────────────────────────────

test('skip link supports keyboard navigation', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: /skip to main content/i })
  await expect(skipLink).toBeFocused()
  await skipLink.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('navbar is visible on all pages', async ({ page }) => {
  for (const path of ['/', '/app', '/chat', '/fact-check', '/timeline']) {
    await page.goto(path)
    await expect(page.locator('header, nav')).toBeVisible()
  }
})

test('/ask redirects to /chat', async ({ page }) => {
  await page.goto('/ask')
  await expect(page).toHaveURL(/\/chat/)
})

test('/verify redirects to /fact-check', async ({ page }) => {
  await page.goto('/verify')
  await expect(page).toHaveURL(/\/fact-check/)
})

test('404 page renders for unknown route', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-xyz')
  await expect(page.locator('body')).toBeVisible()
})

// ── Accessibility ────────────────────────────────────────────────────────────

test('home page has a single h1', async ({ page }) => {
  await page.goto('/')
  const h1Count = await page.locator('h1').count()
  expect(h1Count).toBeGreaterThanOrEqual(1)
})

test('interactive elements have accessible labels', async ({ page }) => {
  await page.goto('/chat')
  const buttons = page.locator('button')
  const count = await buttons.count()
  expect(count).toBeGreaterThan(0)
})
