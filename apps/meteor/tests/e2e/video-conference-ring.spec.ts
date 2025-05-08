import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel, AccountProfile } from './page-objects';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('video conference ringing', () => {
	let poHomeChannel: HomeChannel;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	let auxContext: { page: Page; poHomeChannel: HomeChannel; poAccountProfile: AccountProfile };
	test.beforeEach(async ({ browser }) => {
		const { page } = await createAuxContext(browser, Users.user2);
		auxContext = { page, poHomeChannel: new HomeChannel(page), poAccountProfile: new AccountProfile(page) };
	});

	test.afterEach(async () => {
		await auxContext.page.close();
	});

	test('should display call ringing in direct message', async () => {
		await poHomeChannel.sidenav.openChat('user2');

		await auxContext.poHomeChannel.sidenav.openChat('user1');
		await test.step('should user1 calls user2', async () => {
			await poHomeChannel.content.btnVideoCall.click();
			await poHomeChannel.content.btnStartVideoCall.click();

			await expect(poHomeChannel.content.getVideoConfPopupByName('Calling user2')).toBeVisible();
			await expect(auxContext.poHomeChannel.content.getVideoConfPopupByName('Incoming call from user1')).toBeVisible();

			await auxContext.poHomeChannel.content.btnDeclineVideoCall.click();
		});

		await test.step('should user1 be able to call user2 again ', async () => {
			await poHomeChannel.content.videoConfMessageBlock.last().getByRole('button', { name: 'Call again' }).click();
			await expect(poHomeChannel.content.getVideoConfPopupByName('Start a call with user2')).toBeVisible();
		});
	});
});
