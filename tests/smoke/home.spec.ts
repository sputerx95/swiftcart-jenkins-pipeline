import { expect, test } from '@playwright/test';

test.describe('SwiftCart smoke tests', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(20);
  });

  test('page has a valid title', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });
});
