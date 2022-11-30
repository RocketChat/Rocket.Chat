import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { MarketPlace } from './page-objects/marketplace-apps';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('Install apps', () => {
	let poMarketPlace: MarketPlace;

	test.beforeEach(async ({ page }) => {
		poMarketPlace = new MarketPlace(page);

        await page.goto('/home');
		await poMarketPlace.homsidenav.openInstalledApps();

	});

	test('install an application using upload button', async ({}) => {
		await poMarketPlace.installApp(true);
	});

});