import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('video conference ringing', () => {
	let poHomeChannel: HomeChannel;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	let auxContext: { page: Page; poHomeChannel: HomeChannel };
	test.beforeEach(async ({ browser }) => {
		const { page } = await createAuxContext(browser, Users.user2);
		auxContext = { page, poHomeChannel: new HomeChannel(page) };
	});

	test.afterEach(async () => {
		await auxContext.page.close();
	});

	test('expect is ringing in direct', async () => {
		await poHomeChannel.sidenav.openChat('user2');

		await auxContext.poHomeChannel.sidenav.openChat('user1');
		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.menuItemVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();

		await expect(poHomeChannel.content.videoConfRingCallText('Calling')).toBeVisible();
		await expect(auxContext.poHomeChannel.content.videoConfRingCallText('Incoming call from')).toBeVisible();

		await auxContext.poHomeChannel.content.btnDeclineVideoCall.click();

		await auxContext.page.close();
	});
});
