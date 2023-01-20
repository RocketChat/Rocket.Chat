import type { Browser, Page } from '@playwright/test';

import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';
import { IS_EE } from './config/constants';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	return { page, poHomeChannel };
};

test.use({ storageState: 'user1-session.json' });

test.describe('video conference ringing', () => {
	let poHomeChannel: HomeChannel;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect is ringing in direct', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat('user2');
		const auxContext = await createAuxContext(browser, 'user2-session.json');
		await auxContext.poHomeChannel.sidenav.openChat('user1');
		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();

		await expect(poHomeChannel.content.ringCallText('Calling')).toBeVisible();
		await expect(auxContext.poHomeChannel.content.ringCallText('Incoming call from')).toBeVisible();

		await auxContext.poHomeChannel.content.btnDeclineCall.click();

		await auxContext.page.close();
	});
});
