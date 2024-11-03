import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('omnichannel-auto-transfer-unanswered-chat', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent1: { page: Page; poHomeChannel: HomeChannel };
	let agent2: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }).then((res) => expect(res.status()).toBe(200)),
			api.post('/livechat/users/agent', { username: 'user2' }).then((res) => expect(res.status()).toBe(200)),
			api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }).then((res) => expect(res.status()).toBe(200)),
			api.post('/settings/Livechat_auto_transfer_chat_timeout', { value: 5 }).then((res) => expect(res.status()).toBe(200)),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent1 = { page, poHomeChannel: new HomeChannel(page) };

		const { page: page2 } = await createAuxContext(browser, Users.user2);
		agent2 = { page: page2, poHomeChannel: new HomeChannel(page2) };
	});

	test.afterAll(async ({ api }) => {
		await agent1.page.close();
		await agent2.page.close();

		await Promise.all([
			api.delete('/livechat/users/agent/user1').then((res) => expect(res.status()).toBe(200)),
			api.delete('/livechat/users/agent/user2').then((res) => expect(res.status()).toBe(200)),
			api.post('/settings/Livechat_auto_transfer_chat_timeout', { value: 0 }).then((res) => expect(res.status()).toBe(200)),
		]);
	});

	test.beforeEach(async ({ page, api }) => {
		// make "user-1" online
		await agent1.poHomeChannel.sidenav.switchOmnichannelStatus('online');
		await agent2.poHomeChannel.sidenav.switchOmnichannelStatus('offline');

		// start a new chat for each test
		newVisitor = createFakeVisitor();
		poLiveChat = new OmnichannelLiveChat(page, api);
		await page.goto('/livechat');
		await poLiveChat.openLiveChat();
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
});
