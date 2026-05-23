import { expect, test } from '@playwright/test';

test('main page has at least one usable link or button', async ({ page }) => {
  await page.goto('/');

  const interactiveElements = page.locator('a, button');
  const count = await interactiveElements.count();

  expect(count).toBeGreaterThan(0);
});
