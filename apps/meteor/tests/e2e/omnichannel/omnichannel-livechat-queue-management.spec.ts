import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Queue Management', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poHomeOmnichannel: HomeOmnichannel;
	let poLiveChat: OmnichannelLiveChat;

	const waitingQueueMessage = 'This is a message from Waiting Queue';
	const queuePosition1 = 'Your spot is #1';
	const queuePosition2 = 'Your spot is #2';

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection'),
			setSettingValueById(api, 'Livechat_waiting_queue', true),
			setSettingValueById(api, 'Livechat_waiting_queue_message', waitingQueueMessage),
			createAgent(api, 'user1'),
		]);

		const { page: omniPage } = await createAuxContext(browser, Users.user1, '/', true);
		poHomeOmnichannel = new HomeOmnichannel(omniPage);
	});

	test.beforeEach(async ({ browser, api }) => {
		const context = await browser.newContext();
		const page2 = await context.newPage();

		poLiveChat = new OmnichannelLiveChat(page2, api);
		await poLiveChat.page.goto('/livechat');
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
		await poLiveChat.page.close();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteClosedRooms(api),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
			setSettingValueById(api, 'Livechat_waiting_queue', false),
			setSettingValueById(api, 'Livechat_waiting_queue_message', ''),
			deleteAgent(api, 'user1'),
		]);

		await poHomeOmnichannel.page.close();
	});

	test('OC - Queue Management - Waiting Queue Message enabled', async () => {
		await test.step('should start livechat session', async () => {
			await poLiveChat.startChat();
		});

		await test.step('expect to receive Waiting Queue message on chat', async () => {
			await expect(poLiveChat.page.locator(`div >> text=${waitingQueueMessage}`)).toBeVisible();
		});
	});

	test.describe('OC - Queue Management - Update Queue Position', () => {
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
		});

		test.afterAll(async ({ api }) => {
			await deleteClosedRooms(api);
		});

		test('Update user position on Queue', async () => {
			const { visitor: secondVisitor } = await test.step('should start secondary livechat session', async () => {
				return poLiveChat2.startChat();
			});

			await test.step('should start primary livechat session', async () => {
				await poLiveChat.startChat();
			});

			await test.step('should verify the queue position of the primary user', async () => {
				await expect(poLiveChat.page.locator(`div[role='alert'] >> text=${queuePosition2}`)).toBeVisible();
			});

			await test.step('should allow the agent to take the secondary user chat', async () => {
				await poHomeOmnichannel.sidenav.getQueuedChat(secondVisitor.name).click();
				await expect(poHomeOmnichannel.content.btnTakeChat).toBeVisible();
				await poHomeOmnichannel.content.btnTakeChat.click();
				await expect(poHomeOmnichannel.content.lastSystemMessageBody).toHaveText('joined the channel');
			});

			await test.step('expect the queue position of the primary user to update after the secondary users chat is taken', async () => {
				await expect(poLiveChat.page.locator(`div[role='alert'] >> text=${queuePosition1}`)).toBeVisible();
			});
		});
	});
});
