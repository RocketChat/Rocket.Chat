import type { Awaited } from '@rocket.chat/core-typings';

import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createAuxContext } from './utils';

test.use({ storageState: 'user1-session.json' });

test.describe.serial('Messaging', async () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let auxContext: Awaited<ReturnType<typeof createAuxContext>>;

	test.beforeAll(async ({ api, browser }) => {
		targetChannel = await createTargetChannel(api);
		auxContext = await createAuxContext(browser, 'user2-session.json');
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.afterAll(async () => {
		await auxContext.page.close();
	});

	test('expect to send a message', async () => {
		await test.step('expect show "hello word" in both contexts (targetChannel)', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			await auxContext.poHomeChannel.sidenav.openChat(targetChannel);

			await poHomeChannel.content.sendMessage('hello world');

			await expect(auxContext.poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
			await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
			await expect(poHomeChannel.content.lastUserMessage).not.toHaveClass('.rcx-message--pending');
		});
		await test.step('expect show "hello word" in both contexts (direct)', async () => {
			await poHomeChannel.sidenav.openChat('user2');
			await auxContext.poHomeChannel.sidenav.openChat('user1');

			await poHomeChannel.content.sendMessage('hello world');

			await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
			await expect(auxContext.poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
			await expect(poHomeChannel.content.lastUserMessage).not.toHaveClass('.rcx-message--pending');
		});
	});
});
