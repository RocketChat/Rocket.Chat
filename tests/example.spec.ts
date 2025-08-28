import { test, expect } from '../playwright/fixtures';

test.beforeEach(async ({ page }) => {
	await page.goto('/home');
});

test('end-to-end encryption', async ({ page }) => {
	// Expect a title "to contain" a substring.
	await expect(page).toHaveTitle(/Home - Rocket.Chat/);
	// Create an end-to-end encrypted channel
	await page.getByRole('button', { name: 'Create Channel' }).click();
	await page.getByRole('textbox', { name: 'Channel Name' }).fill('encrypted-channel');
	await page.getByRole('button', { name: 'Create' }).click();
});
