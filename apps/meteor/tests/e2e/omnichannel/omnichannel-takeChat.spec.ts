import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('omnichannel-takeChat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeOmnichannel };

	const sendLivechatMessage = async () => {
		await poLiveChat.openLiveChat();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
		await poLiveChat.btnSendMessageToOnlineAgent.click();
	};

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
		await agent.poHomeChannel.sidenav.switchOmnichannelStatus('online');
		await agent.poHomeChannel.sidenav.switchStatus('online');

		await agent.page.close();
		await Promise.all([
			await api.delete('/livechat/users/agent/user1'),
			await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
			await api.post('/settings/Livechat_enabled_when_agent_idle', { value: true }),
		]);
	});

	test.beforeEach('start a new livechat chat', async ({ page, api }) => {
		await agent.poHomeChannel.sidenav.switchStatus('online');

		newVisitor = createFakeVisitor();

		poLiveChat = new OmnichannelLiveChat(page, api);

		await page.goto('/livechat');
	});

	test('When agent is online should take the chat', async () => {
		await sendLivechatMessage();

		await agent.poHomeChannel.sidenav.getQueuedChat(newVisitor.name).click();

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeVisible();

		await agent.poHomeChannel.content.btnTakeChat.click();
		await agent.poHomeChannel.sidenav.openChat(newVisitor.name);

		await expect(agent.poHomeChannel.content.btnTakeChat).not.toBeVisible();
		await expect(agent.poHomeChannel.content.inputMessage).toBeVisible();
	});

	test('When agent is offline should not take the chat', async () => {
		await agent.poHomeChannel.sidenav.switchStatus('offline');

		await sendLivechatMessage();

		await expect(poLiveChat.alertMessage('Error starting a new conversation: Sorry, no online agents [no-agent-online]')).toBeVisible();
	});

	test('When a new livechat conversation starts but agent is offline, it should not be able to take the chat', async () => {
		await sendLivechatMessage();

		await agent.poHomeChannel.sidenav.switchStatus('offline');
		await agent.poHomeChannel.sidenav.getQueuedChat(newVisitor.name).click();

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeDisabled();

		await agent.poHomeChannel.sidenav.switchStatus('online');
		await agent.poHomeChannel.sidenav.switchOmnichannelStatus('offline');

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeDisabled();
	});
});
