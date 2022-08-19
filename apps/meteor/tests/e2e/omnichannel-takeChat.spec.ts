import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeChannel } from './page-objects';

test.use({ storageState: 'user1-session.json' });

test.describe('omnichannel-takeChat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeChannel: HomeChannel;
	let newVisitor: { email: string; name: string };

	test.beforeAll(async ({ api }) => {
		// make "user-1" an agent and manager
		let statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);

		// turn on manual selection routing
		statusCode = (await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' })).status();
		expect(statusCode).toBe(200);

		// turn off setting which allows offline agents to chat
		statusCode = (await api.post('/settings/Livechat_enabled_when_agent_idle', { value: false })).status();
		expect(statusCode).toBe(200);
	});

	test.beforeEach(async ({ page }) => {
		// start a new chat for each test
		newVisitor = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};
		poLiveChat = new OmnichannelLiveChat(page);
		await page.goto('/livechat');
		await poLiveChat.btnOpenLiveChat('R').click();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterAll(async ({ api }) => {
		// turn off manual selection routing
		let statusCode = (await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' })).status();
		expect(statusCode).toBe(200);

		// turn on setting which allows offline agents to chat
		statusCode = (await api.post('/settings/Livechat_enabled_when_agent_idle', { value: true })).status();
		expect(statusCode).toBe(200);

		// delete "user-1" from agents
		statusCode = (await api.delete('/livechat/users/agent/user1')).status();
		expect(statusCode).toBe(200);
	});

	test('expect "user1" to be able to take the chat from the queue', async () => {
		// make "user-1" online
		await poHomeChannel.sidenav.switchStatus('online');

		await poHomeChannel.sidenav.openChat(newVisitor.name);
		await expect(poHomeChannel.content.takeOmnichannelChatButton).toBeVisible();
		await poHomeChannel.content.takeOmnichannelChatButton.click();

		await poHomeChannel.sidenav.openChat(newVisitor.name);
		await expect(poHomeChannel.content.takeOmnichannelChatButton).not.toBeVisible();
		await expect(poHomeChannel.content.inputMessage).toBeVisible();
	});

	test('expect "user1" to not able able to take chat from queue in-case its user status is offline', async ({ page }) => {
		// make "user-1" offline
		await poHomeChannel.sidenav.switchStatus('offline');

		await poHomeChannel.sidenav.openChat(newVisitor.name);
		await expect(poHomeChannel.content.takeOmnichannelChatButton).toBeVisible();
		await poHomeChannel.content.takeOmnichannelChatButton.click();

		// expect to see error message
		await expect(page.locator('text=Agent status is offline or Omnichannel service is not active')).toBeVisible();
	});
});
