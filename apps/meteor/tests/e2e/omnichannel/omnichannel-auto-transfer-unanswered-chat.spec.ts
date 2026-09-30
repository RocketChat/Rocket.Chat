import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('omnichannel-auto-transfer-unanswered-chat', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let conversation: Awaited<ReturnType<typeof createConversation>>;

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

	test.beforeEach(async ({ api }) => {
		// make "user-1" online
		await agent1.poHomeChannel.navbar.switchOmnichannelStatus('online');
		await agent2.poHomeChannel.navbar.switchOmnichannelStatus('offline');

		// start a new chat for each test
		conversation = await createConversation(api);
	});

	test.afterEach(async () => {
		await conversation.delete();
	});

	test('expect chat to be auto transferred to next agent within 5 seconds of no reply from first agent', async () => {
		await agent1.poHomeChannel.gotoLive(conversation.data.room._id);

		await agent2.poHomeChannel.navbar.switchOmnichannelStatus('online');

		const transferredChat = agent2.poHomeChannel.sidebar.getSidebarItemByName(conversation.data.visitor.name);
		await expect(transferredChat).toBeVisible({ timeout: 15000 });
		await transferredChat.click();
	});
});
