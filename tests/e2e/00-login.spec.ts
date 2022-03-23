import { test, expect } from '@playwright/test';

test('basic test', async ({ page, baseURL }) => {
	await page.goto('https://playwright.dev/');
	console.log(baseURL);
	const title = page.locator('.navbar__inner .navbar__title');
	await expect(title).toHaveText('Playwright');
});
