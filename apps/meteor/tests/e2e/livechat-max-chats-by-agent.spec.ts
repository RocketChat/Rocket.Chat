import type { Page, Browser } from '@playwright/test';
import faker from '@faker-js/faker';
import { MongoClient } from 'mongodb';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, OmnichannelAgents, HomeChannel } from './page-objects';
import { IS_EE, URL_MONGODB } from './config/constants';

async function createAuxContext(browser: Browser): Promise<{ page: Page; poLiveChat: OmnichannelLiveChat }> {
	const page = await browser.newPage();
	const poLiveChat = new OmnichannelLiveChat(page);

	return { page, poLiveChat };
}

test.skip(!IS_EE, 'Enterprise only');

test.use({ storageState: 'admin-session.json' });

test.describe.only('Livechat Management', () => {
	let poAgents: OmnichannelAgents;
	let poHomeChannel: HomeChannel;

	test.beforeAll(async () => {
		const connection = await MongoClient.connect(URL_MONGODB);

		await connection
			.db()
			.collection('rocketchat_livechat_inquiry')
			.updateMany({ status: { $in: ['ready', 'queued'] } }, { $set: { status: 'taken' } });

		await connection
			.db()
			.collection('rocketchat_room')
			.updateMany({ open: true }, { $unset: { open: '' }, $set: { closedAt: new Date(), closedBy: { _id: 'user1', username: 'user1' } } });

		await connection.close();
	});

	test.beforeEach(({ page }) => {
		poAgents = new OmnichannelAgents(page);
		poHomeChannel = new HomeChannel(page);
	});

	test.describe.serial('Verify the max number of simultaneous chats addressed by an agent', () => {
		test('shoud setup the await-queue and the agent', async ({ page, api }) => {
			await test.step('remove "user1" if its already a agent', async () => {
				await page.goto('/omnichannel/agents');
				await poAgents.inputSearch.fill('user1');

				if (await poAgents.btnDeletefirstRowInTable.isVisible()) {
					await poAgents.btnDeletefirstRowInTable.click();
					await poAgents.btnModalRemove.click();
				}
			});

			await test.step('add "user1" as a agent', async () => {
				await poAgents.inputUsername.type('user1', { delay: 1000 });
				await page.keyboard.press('Enter');
				await poAgents.btnAdd.click();
			});

			await test.step('set max chats to 1', async () => {
				await poAgents.inputSearch.fill('user1');
				await poAgents.firstRowInTable.click();
				await poAgents.btnEdit.click();
				await poAgents.inputMaxChats.fill('1');
				await poAgents.btnSave.click();
			});

			await test.step('enable await-queue', async () => {
				const statusCode1 = (await api.post('/settings/Livechat_waiting_queue', { value: true })).status();
				const statusCode2 = (await api.post('/settings/Livechat_waiting_queue_message', { value: 'Please await' })).status();

				expect(statusCode1).toBe(200);
				expect(statusCode2).toBe(200);
			});
		});

		test.describe('expect open one client and put new clients on hold ', () => {
			test.use({ storageState: 'user1-session.json' });

			test('should open chat with one visitor and put any new one on hold', async ({ page, browser }) => {
				const visitor1 = { email: faker.internet.email(), name: faker.name.findName() };
				const visitor2 = { email: faker.internet.email(), name: faker.name.findName() };

				let poAuxContext1: { page: Page; poLiveChat: OmnichannelLiveChat };
				let poAuxContext2: { page: Page; poLiveChat: OmnichannelLiveChat };

				await test.step('"user1" goto /home and two visitors open /livechat', async () => {
					await page.goto('/home');

					poAuxContext1 = await createAuxContext(browser);
					await poAuxContext1.page.goto('/livechat');

					poAuxContext2 = await createAuxContext(browser);
					await poAuxContext2.page.goto('/livechat');
				});

				await test.step('visitors send message in /livechat', async () => {
					await poAuxContext1.poLiveChat.btnOpenLiveChat('R').click();
					await poAuxContext1.poLiveChat.openChat(visitor1, false);
					await poAuxContext1.poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
					await poAuxContext1.poLiveChat.btnSendMessageToOnlineAgent.click();

					await poAuxContext2.poLiveChat.btnOpenLiveChat('R').click();
					await poAuxContext2.poLiveChat.openChat(visitor2, false);
					await poAuxContext2.poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
					await poAuxContext2.poLiveChat.btnSendMessageToOnlineAgent.click();
				});

				await test.step('"user1" reply in "visitor1" chat', async () => {
					await poHomeChannel.sidenav.openChat(visitor1.name);
					await poHomeChannel.content.sendMessage('hello');
				});

				await test.step('"visitor2" must be on a queue', async () => {
					await poAuxContext2.page.pause();
					await expect(poAuxContext2.page.locator('text="Your spot is #1"')).toBeVisible();
				});

				await test.step('close auxContenxt1 and auxContenxt2', async () => {
					await poAuxContext1.page.close();
					await poAuxContext2.page.close();
				});
			});
		});
	});
});
