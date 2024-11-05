import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { test, expect } from '../utils/test';

const firstVisitor = createFakeVisitor();

const secondVisitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Queue Management', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poHomeOmnichannel: HomeOmnichannel;
	let poLiveChat: OmnichannelLiveChat;

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
		await poHomeOmnichannel.sidenav.switchOmnichannelStatus('offline');
	});

	test.beforeEach(async ({ browser, api }) => {
		const context = await browser.newContext();
		const page2 = await context.newPage();

		poLiveChat = new OmnichannelLiveChat(page2, api);
		await poLiveChat.page.goto('/livechat');
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.post('/settings/Livechat_waiting_queue', { value: false }),
			api.post('/settings/Livechat_waiting_queue_message', { value: '' }),
			api.delete('/livechat/users/agent/user1'),
		]);
		await poHomeOmnichannel.page.close();
	});

	test.describe('OC - Queue Management - Auto Selection', () => {
		let poLiveChat2: OmnichannelLiveChat;

		test.beforeEach(async ({ browser, api }) => {
			const context = await browser.newContext();
			const page = await context.newPage();
			poLiveChat2 = new OmnichannelLiveChat(page, api);
			await poLiveChat2.page.goto('/livechat');
		});

		test.afterEach(async () => {
			await poLiveChat2.closeChat();
			await poLiveChat2.page.close();
			await poLiveChat.closeChat();
			await poLiveChat.page.close();
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
				await poHomeOmnichannel.sidenav.switchOmnichannelStatus('online');
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
