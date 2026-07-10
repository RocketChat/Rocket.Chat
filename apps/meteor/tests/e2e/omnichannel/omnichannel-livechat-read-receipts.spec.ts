import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { setSettingValueById } from '../utils';
import { createAgent } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Read Receipts', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;
	let livechatPage: Page;
	let agentPage: Page;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api, browser }) => {
		agent = await createAgent(api, 'user1');

		await Promise.all([
			setSettingValueById(api, 'Message_Read_Receipt_Enabled', true),
			setSettingValueById(api, 'Message_Read_Receipt_Store_Users', true),
			setSettingValueById(api, 'UI_Use_Real_Name', true),
		]);

		({ page: agentPage } = await createAuxContext(browser, Users.user1, '/', true));
		poHomeOmnichannel = new HomeOmnichannel(agentPage);

		({ page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false));
		poLiveChat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.afterAll(({ api }) =>
		Promise.all([
			setSettingValueById(api, 'Message_Read_Receipt_Enabled', false),
			setSettingValueById(api, 'Message_Read_Receipt_Store_Users', false),
			setSettingValueById(api, 'UI_Use_Real_Name', false),
			agent.delete(),
			livechatPage.close(),
			agentPage.close(),
		]),
	);

	test('OC - Livechat - Read receipts should display visitor name', async () => {
		const testMessage = 'test_message_for_read_receipts';

		await test.step('send message from livechat widget', async () => {
			await poLiveChat.page.reload();
			await poLiveChat.openAnyLiveChat();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.fill(testMessage);
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.txtChatMessage(testMessage)).toBeVisible();
		});

		await test.step('agent reads the message', async () => {
			const markedAsRead = agentPage.waitForResponse(
				(res) => /api\/v1\/subscriptions\.read(?:\/|\?|$)/.test(res.url()) && res.request().method() === 'POST',
			);
			await poHomeOmnichannel.navbar.openChat(visitor.name);
			await expect(poHomeOmnichannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannel.content.lastUserMessage).toContainText(testMessage);
			await markedAsRead;
			await expect(poHomeOmnichannel.content.lastUserMessage.getByRole('status', { name: 'Message viewed' })).toBeVisible();
		});

		await test.step('read receipts show both agent and visitor names', async () => {
			await poHomeOmnichannel.content.openLastMessageMenu();
			await agentPage.locator('role=menuitem[name="Read receipts"]').click();

			const dialog = agentPage.getByRole('dialog', { name: 'Read by' });
			const listItems = dialog.getByRole('listitem');
			await expect(listItems).toHaveCount(2);
			await expect(listItems.filter({ hasText: visitor.name })).toHaveCount(1);
			await expect(listItems.filter({ hasText: 'user1' })).toHaveCount(1);
			await dialog.getByLabel('Close').click();
		});
	});
});
