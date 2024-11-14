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
test.describe('OC - Livechat Triggers - Time on site', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };
	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newVisitor = createFakeVisitor();

		await Promise.all([createAgent(api, 'user1'), createManager(api, 'user1')]);

		const triggerRequest = await api.post(
			'/livechat/triggers',

			{
				enabled: true,
				runOnce: false,
				conditions: [{ name: 'time-on-site', value: '1' }],
				actions: [{ name: 'send-message', params: { name: '', msg: 'This is a trigger message time on site', sender: 'queue' } }],
				name: 'test',
				description: 'test',
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

	test('expect to receive trigger message after 1 second', async () => {
		await expect(poLiveChat.page.locator('role=button[name="Close"]')).toBeVisible();
		await expect(poLiveChat.page.locator('role=main')).toContainText('This is a trigger message time on site');
		await expect(poLiveChat.page.locator('role=button[name="Start chat"]')).toBeVisible();
		await expect(poLiveChat.page.locator('role=button[name="Messages"]')).toBeVisible();
	});

	test('OC - Livechat Triggers - after the visitor opens the chat the trigger time-on-site should not be triggered after reload', async () => {
		await expect(poLiveChat.page.locator('role=button[name="Close"]')).toBeVisible();
		await expect(poLiveChat.page.locator('role=main')).toContainText('This is a trigger message time on site');
		await expect(poLiveChat.page.locator('role=button[name="Start chat"]')).toBeVisible();
		await expect(poLiveChat.page.locator('role=button[name="Messages"]')).toBeVisible();

		await poLiveChat.btnOpenOnlineLiveChat('Start chat').click();
		await poLiveChat.btnOpenOnlineLiveChat('Chat now').click();

		await poLiveChat.registerVisitor(newVisitor);

		await test.step('expect to not have any trigger message after registration', async () => {
			await expect(poLiveChat.txtChatMessage('This is a trigger message time on site')).not.toBeVisible();
		});

		await poLiveChat.sendMessage('this_a_test_message_from_visitor');

		await expect(poLiveChat.page.locator('role=main')).toContainText('Chat started');

		await poLiveChat.page.reload();

		await poLiveChat.btnOpenOnlineLiveChat('Rocket.Chat').click();

		await expect(poLiveChat.page.locator('role=main')).toContainText('Chat started');
		await poLiveChat.page.waitForTimeout(1000);
		await expect(poLiveChat.txtChatMessage('This is a trigger message time on site')).not.toBeVisible();

		await poLiveChat.closeChat();
	});
});
