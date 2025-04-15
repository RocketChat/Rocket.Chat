import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('omnichannel-auto-onhold-chat-closing', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser, updateSetting }) => {
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }).then((res) => expect(res.status()).toBe(200)),
			updateSetting('Livechat_Routing_Method', 'Auto_Selection', 'Auto_Selection'),
			updateSetting('Livechat_auto_close_on_hold_chats_timeout', 5, 3600),
			updateSetting('Livechat_allow_manual_on_hold', true, false),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeChannel(page) };
	});
	test.afterAll(async ({ api, restoreSettings }) => {
		await agent.page.close();

		await api.delete('/livechat/users/agent/user1').then((res) => expect(res.status()).toBe(200));
		await restoreSettings();
	});

	test.beforeEach(async ({ page, api }) => {
		// make "user-1" online
		await agent.poHomeChannel.sidenav.switchStatus('online');

		// start a new chat for each test
		newVisitor = createFakeVisitor();
		poLiveChat = new OmnichannelLiveChat(page, api);
		await page.goto('/livechat');
		await poLiveChat.openLiveChat();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();
	});

	// Note: Skipping this test as the scheduler is gonna take 1 minute to process now
	// And waiting for 1 minute in a test is horrible
	test.skip('expect on-hold chat to be closed automatically in 5 seconds', async () => {
		await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		await agent.poHomeChannel.content.sendMessage('this_is_a_test_message_from_agent');

		await agent.poHomeChannel.content.btnOnHold.click();

		await agent.poHomeChannel.content.btnModalConfirm.click();

		// expect to see a system message saying the chat was on-hold
		await expect(agent.poHomeChannel.content.lastSystemMessageBody).toHaveText(
			`Chat On Hold: The chat was manually placed On Hold by user1`,
		);
		await expect(agent.poHomeChannel.content.inputMessage).not.toBeVisible();
		await expect(agent.poHomeChannel.content.resumeOnHoldOmnichannelChatButton).toBeVisible();

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
});
