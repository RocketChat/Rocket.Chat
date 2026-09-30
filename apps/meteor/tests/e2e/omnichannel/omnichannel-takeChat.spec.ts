import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { expectPollUserStatus } from '../utils/expectPollUserStatus';
import { makeAgentAvailable } from '../utils/omnichannel/agents';
import { createConversation } from '../utils/omnichannel/rooms';
import type { BaseTest } from '../utils/test';
import { test, expect } from '../utils/test';

test.describe('omnichannel-takeChat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };
	let conversation: Awaited<ReturnType<typeof createConversation>> | undefined;

	let agent: { page: Page; poHomeChannel: HomeOmnichannel };

	const setUserStatus = (api: BaseTest['api'], status: 'online' | 'offline') =>
		api.post('/users.setStatus', { userId: 'user1', message: '', status });

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
		await makeAgentAvailable(api, 'user1');

		await agent.page.close();
		await Promise.all([
			await api.delete('/livechat/users/agent/user1'),
			await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: true }),
		]);
	});

	test.beforeEach(async ({ api }) => {
		await makeAgentAvailable(api, 'user1');
		await expectPollUserStatus(api, 'user1', 'online');

		newVisitor = createFakeVisitor();
	});

	test.afterEach(async () => {
		await conversation?.delete();
		conversation = undefined;
	});

	test('When agent is online should take the chat', async ({ api }) => {
		conversation = await createConversation(api, { visitorName: newVisitor.name });

		await agent.poHomeChannel.sidebar.getSidebarItemByName(newVisitor.name).click();

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeVisible();

		await agent.poHomeChannel.content.btnTakeChat.click();

		await expect(agent.poHomeChannel.content.btnTakeChat).not.toBeVisible();
		await expect(agent.poHomeChannel.composer.inputMessage).toBeVisible();
	});

	test('When agent is offline should not take the chat', async ({ page, api }) => {
		await setUserStatus(api, 'offline');
		await expectPollUserStatus(api, 'user1', 'offline');

		poLiveChat = new OmnichannelLiveChat(page, api);
		await poLiveChat.goto();
		await poLiveChat.openLiveChat();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();

		await expect(poLiveChat.alertMessage('Error starting a new conversation: Sorry, no online agents [no-agent-online]')).toBeVisible();
	});

	test('When a new livechat conversation is selected and the agent becomes offline or unavailable, they should not be able to take the chat', async ({
		api,
	}) => {
		conversation = await createConversation(api, { visitorName: newVisitor.name });

		await agent.poHomeChannel.sidebar.getSidebarItemByName(newVisitor.name).click();

		await setUserStatus(api, 'offline');
		await expectPollUserStatus(api, 'user1', 'offline');

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeDisabled();

		await setUserStatus(api, 'online');
		await expectPollUserStatus(api, 'user1', 'online');
		await agent.poHomeChannel.navbar.switchOmnichannelStatus('offline');

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeDisabled();
	});
});
