import { expect, test } from '@playwright/test'

test('home page renders key CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /understand your vote in one workflow./i })).toBeVisible()
  await expect(page.getByRole('link', { name: /open workspace/i })).toBeVisible()
})

test('command center route is reachable', async ({ page }) => {
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: /pick one civic task and complete it./i })).toBeVisible()
})

test('skip link supports keyboard navigation', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: /skip to main content/i })
  await expect(skipLink).toBeFocused()
  await skipLink.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})
