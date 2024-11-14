import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { setSettingValueById } from '../utils';
import { deleteAgent } from '../utils/omnichannel/agents';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('omnichannel-takeChat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };
	let agent: { page: Page; poHomeChannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			await api.post('/livechat/users/agent', { username: 'user1' }).then((res) => expect(res.status()).toBe(200)),
			await setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection'),
			await setSettingValueById(api, 'Livechat_enabled_when_agent_idle', false),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeOmnichannel(page) };
	});

	test.beforeEach('start a new livechat chat', async ({ page, api }) => {
		await agent.poHomeChannel.sidenav.switchStatus('online');

		visitor = createFakeVisitor();

		poLiveChat = new OmnichannelLiveChat(page, api);

		await page.goto('/livechat');
	});

	test.afterAll(async ({ api }) => {
		await agent.poHomeChannel.sidenav.switchOmnichannelStatus('online');
		await agent.poHomeChannel.sidenav.switchStatus('online');

		await agent.page.close();
		await Promise.all([
			deleteClosedRooms(api),
			deleteAgent(api, 'user1'),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
			setSettingValueById(api, 'Livechat_enabled_when_agent_idle', true),
		]);
	});

	test('When agent is online should take the chat', async () => {
		await poLiveChat.startChat({ visitor });

		await agent.poHomeChannel.sidenav.getQueuedChat(visitor.name).click();

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeVisible();

		await agent.poHomeChannel.content.btnTakeChat.click();
		await agent.poHomeChannel.sidenav.openChat(visitor.name);

		await expect(agent.poHomeChannel.content.btnTakeChat).not.toBeVisible();
		await expect(agent.poHomeChannel.content.inputMessage).toBeVisible();

		await poLiveChat.closeChat();
	});

	test('When agent is offline should not take the chat', async () => {
		await agent.poHomeChannel.sidenav.switchStatus('offline');

		await poLiveChat.startChat({ visitor, waitForChatStart: false });

		await expect(poLiveChat.alertMessage('Error starting a new conversation: Sorry, no online agents [no-agent-online]')).toBeVisible();
	});

	test('When a new livechat conversation starts but agent is offline, it should not be able to take the chat', async () => {
		await poLiveChat.startChat({ visitor });

		await agent.poHomeChannel.sidenav.switchStatus('offline');
		await agent.poHomeChannel.sidenav.getQueuedChat(visitor.name).click();

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeDisabled();

		await agent.poHomeChannel.sidenav.switchStatus('online');
		await agent.poHomeChannel.sidenav.switchOmnichannelStatus('offline');

		await expect(agent.poHomeChannel.content.btnTakeChat).toBeDisabled();

		await poLiveChat.closeChat();
	});
});
