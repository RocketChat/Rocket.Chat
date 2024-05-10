import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });
test.describe('OC - Livechat Triggers - Time on site', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };
	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};

		const requests = await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
			api.post(
				'/livechat/triggers',

				{
					enabled: true,
					runOnce: false,
					conditions: [{ name: 'time-on-site', value: '1' }],
					actions: [{ name: 'send-message', params: { name: '', msg: 'This is a trigger message time on site', sender: 'queue' } }],
					name: 'test',
					description: 'test',
				},
			),
		]);

		requests.every((e) => expect(e.status()).toBe(200));

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
			api.delete('/livechat/users/agent/user1'),
			api.delete('/livechat/users/manager/user1'),
			api.post('/settings/Livechat_clear_local_storage_when_chat_ended', { value: false }),
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

		await poLiveChat.sendMessage(newUser, false);

		await test.step('expect to not have any trigger message after registration', async () => {
			await expect(poLiveChat.txtChatMessage('This is a trigger message time on site')).not.toBeVisible();
		});

		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
		await poLiveChat.btnSendMessageToOnlineAgent.click();

		await expect(poLiveChat.page.locator('role=main')).toContainText('Chat started');

		await poLiveChat.page.reload();

		await poLiveChat.btnOpenOnlineLiveChat('Rocket.Chat').click();

		await expect(poLiveChat.page.locator('role=main')).toContainText('Chat started');
		await poLiveChat.page.waitForTimeout(1000);
		await expect(poLiveChat.txtChatMessage('This is a trigger message time on site')).not.toBeVisible();
	});
});
