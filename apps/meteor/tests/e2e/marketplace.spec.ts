import { Marketplace } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('marketplace', () => {
	let poMarketplace: Marketplace;

	test.beforeEach(async ({ page }) => {
		await page.goto('/marketplace/explore');

		poMarketplace = new Marketplace(page);
	});

	test.describe('Admin flow', () => {
		test('expect to render at least one app row', async () => {
			await expect(poMarketplace.appRow.last()).toBeVisible();
		});

		test('expect not found message if there is no app with input name', async () => {
			await poMarketplace.marketplaceFilter.type('*MyDummyApp');

			await expect(poMarketplace.noAppMatches).toBeVisible();
		});
	});
});
