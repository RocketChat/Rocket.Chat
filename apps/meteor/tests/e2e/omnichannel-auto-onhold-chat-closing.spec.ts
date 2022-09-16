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

test.describe('omnichannel-auto-onhold-chat-closing', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		// make "user-1" an agent and manager
		let statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);

		// turn on auto selection routing
		statusCode = (await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' })).status();
		expect(statusCode).toBe(200);

		// make auto close on-hold chats timeout to be 5 seconds
		statusCode = (await api.post('/settings/Livechat_auto_close_on_hold_chats_timeout', { value: 5 })).status();
		expect(statusCode).toBe(200);

		// allow agents to manually place chats on-hold
		statusCode = (await api.post('/settings/Livechat_allow_manual_on_hold', { value: true })).status();
		expect(statusCode).toBe(200);

		agent = await createAuxContext(browser, 'user1-session.json');
	});

	test.beforeEach(async ({ page }) => {
		// make "user-1" online
		await agent.poHomeChannel.sidenav.switchStatus('online');

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

	test('expect on-hold chat to be closed automatically in 5 seconds', async () => {
		await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		await agent.poHomeChannel.content.sendMessage('this_is_a_test_message_from_agent');

		expect(agent.poHomeChannel.content.btnOnHold).toBeVisible();
		await agent.poHomeChannel.content.btnOnHold.click();

		// expect to see a confirmation modal
		expect(agent.poHomeChannel.content.btnModalConfirm).toBeVisible();
		await agent.poHomeChannel.content.btnModalConfirm.click();

		// expect to see a system message saying the chat was on-hold
		expect(agent.poHomeChannel.content.lastSystemMessageBody).toHaveText(`Chat On Hold: The chat was manually placed On Hold by user1`);
		expect(agent.poHomeChannel.content.inputMessage).not.toBeVisible();
		expect(agent.poHomeChannel.content.resumeOnHoldOmnichannelChatButton).toBeVisible();

		// current url
		const chatRoomUrl = agent.page.url();

		// wait for the chat to be closed automatically for 5 seconds
		await agent.page.waitForTimeout(7000);

		// expect to see a system message saying the chat was closed automatically in the closed chat room
		await agent.page.goto(chatRoomUrl);
		expect(await agent.poHomeChannel.content.lastSystemMessageBody.innerText()).toBe(
			'Conversation closed: Closed automatically because chat was On Hold for 5 seconds.',
		);
	});

	test.afterAll(async ({ api }) => {
		// delete "user-1" from agents
		let statusCode = (await api.delete('/livechat/users/agent/user1')).status();
		expect(statusCode).toBe(200);

		// reset auto close on-hold chats timeout
		statusCode = (await api.post('/settings/Livechat_auto_close_on_hold_chats_timeout', { value: 3600 })).status();
		expect(statusCode).toBe(200);

		// reset setting which allows agents to manually place chats on-hold
		statusCode = (await api.post('/settings/Livechat_allow_manual_on_hold', { value: false })).status();
		expect(statusCode).toBe(200);
	});
});
