import type { Page } from '@playwright/test';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Apps > ContextualBar', () => {
	let poHomeChannel: HomeChannel;

	let page: Page;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat('general');
	});

	test.afterAll(async () => {
		await page.close();
	});

	test('expect allow user open app contextualbar', async () => {
		await poHomeChannel.content.dispatchSlashCommand('/contextualbar');
		await expect(poHomeChannel.btnContextualbarClose).toBeVisible();
	});

	test('expect app contextualbar to be closed', async () => {
		await poHomeChannel.btnContextualbarClose.click();
		await expect(poHomeChannel.btnContextualbarClose).toBeHidden();
	});
});
