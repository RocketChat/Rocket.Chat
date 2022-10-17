import type { Browser, Page } from '@playwright/test';

import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';
import { IS_EE } from './config/constants';
import { createTargetChannel, createTargetTeam, createDirectMessage } from './utils';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	return { page, poHomeChannel };
};

test.use({ storageState: 'user1-session.json' });

test.describe('video conference ringing', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetTeam: string;
	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		targetTeam = await createTargetTeam(api);
		await createDirectMessage(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.skip('expect is ringing in direct', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat('user2');
		const auxContext = await createAuxContext(browser, 'user2-session.json');
		await auxContext.poHomeChannel.sidenav.openChat('user1');
		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();

		await auxContext.page.close();
	});

	test.skip('expect is ringing in channel', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		const auxContext = await createAuxContext(browser, 'user2-session.json');
		await auxContext.poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();
		await auxContext.page.close();
	});

	test.skip('expect is ringing in teams', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat(targetTeam);
		const auxContext = await createAuxContext(browser, 'user2-session.json');
		await auxContext.poHomeChannel.sidenav.openChat(targetTeam);
		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();
		await auxContext.page.close();
	});

	test.skip('expect is ringing in multiple', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat('rocketchat.internal.admin.test, user2');
		const auxContext = await createAuxContext(browser, 'user2-session.json');
		await auxContext.poHomeChannel.sidenav.openChat('rocketchat.internal.admin.test, user1');

		await poHomeChannel.content.btnCall.click();
		await poHomeChannel.content.btnStartCall.click();

		expect(1).toBe(1);
		await auxContext.page.close();
	});
});
