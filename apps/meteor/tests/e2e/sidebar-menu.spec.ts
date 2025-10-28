import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('sidebar-menu', () => {
	test('expect popover to stay open after home loads', async ({ page }) => {
		await page.route('**/__meteor__/dynamic-import/fetch', async (route, request) => {
			if (request.postData()?.includes('HomePage.tsx')) {
				await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
			}
			await route.continue();
		});

		await page.goto('/home', { waitUntil: 'domcontentloaded' });
		await expect(page.getByRole('button', { name: 'Create new' })).toBeVisible();

		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Enter');

		await page.waitForURL('/directory/channels');

		const textContent = await page.evaluate(() => document.activeElement?.textContent);
		expect(textContent).toMatch(/Directory/);

		await page.getByRole('button', { name: 'Create new' }).click();
		await expect(page.getByRole('menu', { name: 'Create new' })).toBeVisible();
		await page.getByRole('menuitem', { name: 'Direct message' }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
	});
});
