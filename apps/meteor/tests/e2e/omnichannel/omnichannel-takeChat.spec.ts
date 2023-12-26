import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('omnichannel-takeChat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			await api.post('/livechat/users/agent', { username: 'user1' }).then((res) => expect(res.status()).toBe(200)),
			await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' }).then((res) => expect(res.status()).toBe(200)),
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: false }).then((res) => expect(res.status()).toBe(200)),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeOmnichannel(page) };
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }).then((res) => expect(res.status()).toBe(200)),
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: false }).then((res) => expect(res.status()).toBe(200)),
			await api.delete('/livechat/users/agent/user1').then((res) => expect(res.status()).toBe(200)),
		]);

		await agent.page.close();
	});

	test.beforeEach(async ({ page, api }) => {
		// make "user-1" online
		await agent.poHomeChannel.sidenav.switchStatus('online');

		// start a new chat for each test
		newVisitor = {
			name: `${faker.person.firstName()} ${faker.string.uuid()}`,
			email: faker.internet.email(),
		};
		poLiveChat = new OmnichannelLiveChat(page, api);
		await page.goto('/livechat');
		await poLiveChat.openLiveChat();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();
	});

	test('expect "user1" to be able to take the chat from the queue', async () => {
		await agent.poHomeChannel.sidenav.openQueuedOmnichannelChat(newVisitor.name);
		await expect(agent.poHomeChannel.content.btnTakeChat).toBeVisible();
		await agent.poHomeChannel.content.btnTakeChat.click();

		await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		await expect(agent.poHomeChannel.content.btnTakeChat).not.toBeVisible();
		await expect(agent.poHomeChannel.content.inputMessage).toBeVisible();
	});

	test('expect "user1" to not able able to take chat from queue in-case its user status is offline', async () => {
		// make "user-1" offline
		await agent.poHomeChannel.sidenav.switchStatus('offline');

		await agent.poHomeChannel.sidenav.openQueuedOmnichannelChat(newVisitor.name);
		await expect(agent.poHomeChannel.content.btnTakeChat).toBeVisible();
		await agent.poHomeChannel.content.btnTakeChat.click();

		// expect to see error message
		await expect(agent.page.locator('text=Agent status is offline or Omnichannel service is not active')).toBeVisible();
	});
});
