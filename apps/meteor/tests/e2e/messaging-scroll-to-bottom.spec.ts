import { faker } from '@faker-js/faker';
import type { Locator } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deleteChannel } from './utils';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Messaging scroll to bottom', () => {
	let targetChannel: { name: string; _id: string };
	let poHomeChannel: HomeChannel;
	let mainMessage: { _id: string };

	const fillMessages = async (api: BaseTest['api']) => {
		const firstResponse = await api.post('/chat.postMessage', {
			roomId: targetChannel._id,
			text: faker.lorem.paragraphs(6),
		});

		const { message: firstMessage } = await firstResponse.json();
		mainMessage = firstMessage;

		await Promise.all(
			Array.from({ length: 4 }).map(() =>
				api.post('/chat.postMessage', {
					roomId: targetChannel._id,
					text: faker.lorem.paragraphs(6),
				}),
			),
		);

		await Promise.all(
			Array.from({ length: 5 }).map(() =>
				api.post('/chat.postMessage', {
					roomId: targetChannel._id,
					text: faker.lorem.paragraphs(6),
					tmid: firstMessage._id,
				}),
			),
		);
	};

	const scrollToTop = async (scroller: Locator) => {
		await scroller.evaluate((el) => {
			el.scrollTop = 0;
		});
		await expect(scroller).toHaveJSProperty('scrollTop', 0);
	};

	const expectScrolledToBottom = async (scroller: Locator) => {
		await expect.poll(() => scroller.evaluate((el) => Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)) < 2)).toBe(true);
	};

	test.beforeAll(async ({ api }) => {
		await api
			.post('/channels.create', { name: faker.string.uuid() })
			.then((res) => res.json())
			.then((data) => {
				targetChannel = data.channel;
			});

		await fillMessages(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto(`/channel/${targetChannel._id}/thread/${mainMessage._id}`);
		await poHomeChannel.content.waitForChannel();
		await poHomeChannel.content.waitForThread();
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel.name);
	});

	test('should scroll the main message list to bottom when sending a message in the main channel', async ({ page }) => {
		await page.setViewportSize({ width: 1023, height: 700 });

		await scrollToTop(poHomeChannel.content.mainMessageListScroller);

		await poHomeChannel.content.sendMessage('main channel message');

		await expectScrolledToBottom(poHomeChannel.content.mainMessageListScroller);
	});

	test('should scroll the thread message list to bottom when sending a message in the thread', async ({ page }) => {
		await page.setViewportSize({ width: 1023, height: 700 });

		await scrollToTop(poHomeChannel.content.threadMessageListScroller);

		await poHomeChannel.content.sendMessageInThread('new thread reply');

		await expectScrolledToBottom(poHomeChannel.content.threadMessageListScroller);
	});

	test('should not scroll the main channel message list when sending a message in the thread', async ({ page }) => {
		await page.setViewportSize({ width: 1023, height: 700 });

		await scrollToTop(poHomeChannel.content.mainMessageListScroller);
		await scrollToTop(poHomeChannel.content.threadMessageListScroller);

		await poHomeChannel.content.sendMessageInThread('another thread reply');

		await expectScrolledToBottom(poHomeChannel.content.threadMessageListScroller);
		await expect(poHomeChannel.content.mainMessageListScroller).toHaveJSProperty('scrollTop', 0);
	});

	test('should not scroll the thread message list when sending a message in the main channel', async ({ page }) => {
		await page.setViewportSize({ width: 1023, height: 700 });

		await scrollToTop(poHomeChannel.content.mainMessageListScroller);
		await scrollToTop(poHomeChannel.content.threadMessageListScroller);

		await poHomeChannel.content.sendMessage('another main channel message');

		await expectScrolledToBottom(poHomeChannel.content.mainMessageListScroller);
		await expect(poHomeChannel.content.threadMessageListScroller).toHaveJSProperty('scrollTop', 0);
	});
});
