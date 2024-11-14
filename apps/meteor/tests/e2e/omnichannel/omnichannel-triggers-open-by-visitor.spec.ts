import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { createManager, deleteManager } from '../utils/omnichannel/managers';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });
test.describe('OC - Livechat Triggers - Open by Visitor', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };
	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newVisitor = createFakeVisitor();

		await Promise.all([createAgent(api, 'user1'), createManager(api, 'user1')]);

		const triggerRequest = await api.post(
			'/livechat/triggers',

			{
				name: 'open',
				description: '',
				enabled: true,
				runOnce: false,
				conditions: [
					{
						name: 'chat-opened-by-visitor',
						value: '',
					},
				],
				actions: [
					{
						name: 'send-message',
						params: {
							name: '',
							msg: 'This is a trigger message open by visitor',
							sender: 'queue',
						},
					},
				],
			},
		);

		expect(triggerRequest.status()).toBe(200);

		const { page } = await createAuxContext(browser, Users.user1, '/');
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
		await page.goto('/livechat');
	});

	test.afterAll(async ({ api }) => {
		const ids = (await (await api.get('/livechat/triggers')).json()).triggers.map(
			(trigger: { _id: string }) => trigger._id,
		) as unknown as string[];

		await Promise.all(ids.map((id) => api.delete(`/livechat/triggers/${id}`)));

		await Promise.all([
			deleteClosedRooms(api),
			deleteAgent(api, 'user1'),
			deleteManager(api, 'user1'),
			setSettingValueById(api, 'Livechat_clear_local_storage_when_chat_ended', false),
		]);
		await agent.page.close();
	});

	test('OC - Livechat Triggers - after the visitor opens the chat the trigger message should not be visible neither after a page reload', async () => {
		await test.step('expect to open livechat and to the trigger message to be visible', async () => {
			await poLiveChat.openLiveChat();

			await expect(poLiveChat.txtChatMessage('This is a trigger message open by visitor')).toBeVisible();
		});

		await test.step('expect to start conversation', async () => {
			await poLiveChat.btnChatNow.click();
			await poLiveChat.registerVisitor(newVisitor);

			await poLiveChat.sendMessage('this_a_test_message_from_visitor');

			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor')).toBeVisible();
		});

		await test.step('expect to keep history after reload', async () => {
			await poLiveChat.page.reload();

			// if the request took too long, the loadMessage cleans triggers, but if the fetch is fast enough, the trigger message will be visible
			await poLiveChat.page.waitForRequest(/livechat\/messages.history/);

			await poLiveChat.openLiveChat();
			await expect(poLiveChat.txtChatMessage('This is a trigger message open by visitor')).not.toBeVisible();
			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_visitor')).toBeVisible();
		});

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});
});
