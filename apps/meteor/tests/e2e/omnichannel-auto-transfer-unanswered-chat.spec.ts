import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeChannel } from './page-objects';
import { IS_EE } from './config/constants';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	await page.locator('.main-content').waitFor();

	return { page, poHomeChannel };
};

test.describe('omnichannel-auto-transfer-unanswered-chat', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent1: { page: Page; poHomeChannel: HomeChannel };
	let agent2: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		// make "user-1" & "user-2" an agent
		let statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);
		statusCode = (await api.post('/livechat/users/agent', { username: 'user2' })).status();
		expect(statusCode).toBe(200);

		// turn on auto selection routing
		statusCode = (await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' })).status();
		expect(statusCode).toBe(200);

		// make auto close on-hold chats timeout to be 5 seconds
		statusCode = (await api.post('/settings/Livechat_auto_transfer_chat_timeout', { value: 5 })).status();
		expect(statusCode).toBe(200);

		agent1 = await createAuxContext(browser, 'user1-session.json');
		agent2 = await createAuxContext(browser, 'user2-session.json');
	});

	test.beforeEach(async ({ page }) => {
		// make "user-1" online
		await agent1.poHomeChannel.sidenav.switchOmnichannelStatus('online');
		await agent2.poHomeChannel.sidenav.switchOmnichannelStatus('offline');

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

	test('expect chat to be auto transferred to next agent within 5 seconds of no reply from first agent', async () => {
		await agent1.poHomeChannel.sidenav.openChat(newVisitor.name);

		await agent2.poHomeChannel.sidenav.switchOmnichannelStatus('online');

		// wait for the chat to be closed automatically for 5 seconds
		await agent1.page.waitForTimeout(7000);

		await agent2.poHomeChannel.sidenav.openChat(newVisitor.name);
	});

	test.afterAll(async ({ api }) => {
		// delete "user-1" from agents
		let statusCode = (await api.delete('/livechat/users/agent/user1')).status();
		expect(statusCode).toBe(200);

		// delete "user-2" from agents
		statusCode = (await api.delete('/livechat/users/agent/user2')).status();
		expect(statusCode).toBe(200);

		// reset auto close on-hold chats timeout
		statusCode = (await api.post('/settings/Livechat_auto_transfer_chat_timeout', { value: 0 })).status();
		expect(statusCode).toBe(200);
	});
});
