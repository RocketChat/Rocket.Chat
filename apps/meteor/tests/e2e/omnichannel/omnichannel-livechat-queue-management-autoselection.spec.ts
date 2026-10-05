import type { BrowserContext } from '@playwright/test';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { closeRoom } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

const firstVisitor = createFakeVisitor();

const secondVisitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Queue Management', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poHomeOmnichannel: HomeOmnichannel;
	let poLiveChat: OmnichannelLiveChat;
	let liveChatContext: BrowserContext;

	const waitingQueueMessage = 'This is a message from Waiting Queue';

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
			api.post('/settings/Livechat_accept_chats_with_no_agents', { value: true }),
			api.post('/settings/Livechat_waiting_queue', { value: true }),
			api.post('/settings/Livechat_waiting_queue_message', { value: waitingQueueMessage }),
			api.post('/livechat/users/agent', { username: 'user1' }),
		]);

		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);

		// Agent will be offline for these tests
		await poHomeOmnichannel.navbar.switchOmnichannelStatus('offline');
	});

	test.beforeEach(async ({ browser, api }) => {
		liveChatContext = await browser.newContext();
		const page2 = await liveChatContext.newPage();

		poLiveChat = new OmnichannelLiveChat(page2, api);
		await poLiveChat.goto();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Livechat_accept_chats_with_no_agents', { value: false }),
			api.post('/settings/Livechat_waiting_queue', { value: false }),
			api.post('/settings/Livechat_waiting_queue_message', { value: '' }),
			api.delete('/livechat/users/agent/user1'),
		]);
		await poHomeOmnichannel.page.close();
	});

	test.describe('OC - Queue Management - Auto Selection', () => {
		let poLiveChat2: OmnichannelLiveChat;
		let liveChat2Context: BrowserContext;

		test.beforeEach(async ({ browser, api }) => {
			liveChat2Context = await browser.newContext();
			const page = await liveChat2Context.newPage();
			poLiveChat2 = new OmnichannelLiveChat(page, api);
			await poLiveChat2.goto();
		});

		test.afterEach(async ({ api }) => {
			await Promise.all(
				[firstVisitor.name, secondVisitor.name].map(async (roomName) => {
					const { rooms } = await (await api.get('/livechat/rooms', { roomName, open: true })).json();
					await Promise.all(rooms.map((room: IOmnichannelRoom) => closeRoom(api, { roomId: room._id, visitorToken: room.v.token })));
				}),
			);
			await Promise.all([liveChat2Context.close(), liveChatContext.close()]);
		});

		test('Update user position on Queue', async () => {
			await test.step('should start livechat session', async () => {
				await poLiveChat.openAnyLiveChatAndSendMessage({
					liveChatUser: firstVisitor,
					message: 'Test message',
					isOffline: false,
				});
			});

			await test.step('expect to receive Waiting Queue message on chat', async () => {
				await expect(poLiveChat.page.locator(`div >> text=${waitingQueueMessage}`)).toBeVisible();
			});

			await test.step('expect to be on spot #1', async () => {
				await expect(poLiveChat.queuePosition(1)).toBeVisible();
			});

			await test.step('should start secondary livechat session', async () => {
				await poLiveChat2.openAnyLiveChatAndSendMessage({
					liveChatUser: secondVisitor,
					message: 'Test message',
					isOffline: false,
				});
			});

			await test.step('should start secondary livechat on spot #2', async () => {
				await expect(poLiveChat2.queuePosition(2)).toBeVisible();
			});

			await test.step('should start the queue by making the agent available again', async () => {
				await poHomeOmnichannel.navbar.switchOmnichannelStatus('online');
			});

			await test.step('user1 should get assigned to the first chat', async () => {
				await expect(poLiveChat.queuePosition(1)).not.toBeVisible();
			});

			await test.step('secondary session should be on position #1', async () => {
				await expect(poLiveChat2.queuePosition(1)).toBeVisible();
			});

			await test.step('secondary session should be taken by user1', async () => {
				await expect(poLiveChat2.queuePosition(1)).not.toBeVisible();
			});
		});
	});
});
