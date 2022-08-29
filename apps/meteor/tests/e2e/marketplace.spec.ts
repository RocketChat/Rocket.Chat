import { test, expect } from './utils/test';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('marketplace', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/marketplace');
	});

	test('expect not found message if there is no app with input name', async ({ page }) => {
		const textFilter = page.locator('[placeholder="Search Apps"]');

		await textFilter.type('*');

		await expect(page.locator('text=No app matches')).toBeVisible();
	});

	test('expect to find app if it exists on the list', async ({ page }) => {
		const textFilter = page.locator('[placeholder="Search Apps"]');

		await textFilter.type('Add Reminder');

		await expect(page.locator('text=Add Reminder')).toBeVisible();
	});
});
