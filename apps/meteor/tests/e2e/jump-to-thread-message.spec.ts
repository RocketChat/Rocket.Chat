import type { IMessage } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import type { BrowserContext, Page } from 'playwright-core';

import { Users } from './fixtures/userStates';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Threads', () => {
	let targetChannel: { name: string; _id: string };
	let threadMessage: IMessage;
	let mainMessage: IMessage;
	let page: Page;
	let context: BrowserContext;

	const fillMessages = async (api: BaseTest['api']) => {
		const { message: parentMessage } = await (
			await api.post('/chat.postMessage', { roomId: targetChannel._id, text: 'this is a message for reply' })
		).json();
		mainMessage = parentMessage;

		// fill thread with messages
		const largeSimpleMessage = 'This is a large message with a lot of text to create scroll view in thread'.repeat(5);
		const { message: childMessage } = await (
			await api.post('/chat.postMessage', { roomId: targetChannel._id, text: largeSimpleMessage, tmid: parentMessage._id })
		).json();
		threadMessage = childMessage;

		await Promise.all(
			Array.from({ length: 5 }).map(() =>
				api.post('/chat.postMessage', { roomId: targetChannel._id, text: largeSimpleMessage, tmid: parentMessage._id }),
			),
		);

		// fill room with normal messages
		await Promise.all(
			Array.from({ length: 5 }).map(() => api.post('/chat.postMessage', { roomId: targetChannel._id, text: largeSimpleMessage })),
		);
	};

	test.beforeAll(async ({ api, browser }) => {
		targetChannel = (await (await api.post('/channels.create', { name: Random.id() })).json()).channel;
		await fillMessages(api);
		context = await browser.newContext({ storageState: Users.admin.state });
		page = await context.newPage();
	});

	test.afterAll(async ({ api }) => {
		await api.post('/channels.delete', { roomId: targetChannel._id });
		await page.close();
		await context.close();
	});

	test('expect to jump scroll to a non-thread message on opening its message link', async () => {
		const messageLink = `/channel/${targetChannel.name}?msg=${mainMessage._id}`;
		await page.goto(messageLink);

		await expect(async () => {
			await page.waitForSelector('#main-content');
			await page.waitForSelector(`[data-qa-rc-room="${targetChannel._id}"]`);
		}).toPass();

		const message = page.locator(`[aria-label=\"Message list\"] [data-id=\"${mainMessage._id}\"]`);

		await expect(message).toBeVisible();
		await expect(message).toBeInViewport();
	});

	test('expect to jump scroll to thread message on opening its message link', async () => {
		const threadMessageLink = `/channel/${targetChannel.name}?msg=${threadMessage._id}`;
		await page.goto(threadMessageLink);

		await expect(async () => {
			await page.waitForSelector('#main-content');
			await page.waitForSelector(`[data-qa-rc-room="${targetChannel._id}"]`);
		}).toPass();

		const message = await page.locator(`[aria-label=\"Thread message list\"] [data-id=\"${threadMessage._id}\"]`);

		await expect(message).toBeVisible();
		await expect(message).toBeInViewport();
	});

	test('expect to jump scroll to thread message on opening its message link from a different channel', async () => {
		const threadMessageLink = `/channel/general?msg=${threadMessage._id}`;
		await page.goto(threadMessageLink);

		await expect(async () => {
			await page.waitForSelector('#main-content');
			await page.waitForSelector(`[data-qa-rc-room="${targetChannel._id}"]`);
		}).toPass();

		const message = await page.locator(`[aria-label=\"Thread message list\"] [data-id=\"${threadMessage._id}\"]`);

		await expect(message).toBeVisible();
		await expect(message).toBeInViewport();
	});
});
