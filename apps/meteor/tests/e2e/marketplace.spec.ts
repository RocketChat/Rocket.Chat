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

		test.describe('Installed Apps Page', () => {
			test.beforeEach(async ({ page }) => {
				await page.goto('/marketplace/installed');
			});

			test('expect installed app kebab menu to have all possible options', async () => {
				await poMarketplace.marketplaceFilter.type('Apps.RocketChat.Tester');

				await poMarketplace.appKebabMenu.click();

				await expect(poMarketplace.viewLogs).toBeVisible();
				await expect(poMarketplace.disable).toBeVisible();
				await expect(poMarketplace.uninstall).toBeVisible();
			});
		});
	});
});
