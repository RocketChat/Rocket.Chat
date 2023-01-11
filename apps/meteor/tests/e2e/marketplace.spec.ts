import { Marketplace } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('marketplace', () => {
	let poMarketplace: Marketplace;

	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/marketplace');

		poMarketplace = new Marketplace(page);
	});

	test('expect not found message if there is no app with input name', async () => {
		await poMarketplace.marketplaceFilter.type('*');

		await expect(poMarketplace.NoAppMatches).toBeVisible();
	});

	test('expect to find app if it exists on the list', async ({ page }) => {
		await poMarketplace.marketplaceFilter.type('Add Reminder');

		await expect(page.locator('text=Add Reminder')).toBeVisible();
	});
});
