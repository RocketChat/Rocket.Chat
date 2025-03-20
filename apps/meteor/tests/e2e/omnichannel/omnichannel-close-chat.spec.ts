import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('Omnichannel close chat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newVisitor = createFakeVisitor();

		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
	});
	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
	});

	test('Receiving a message from visitor', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('Expect to be able to close an omnichannel to conversation', async () => {
			await agent.poHomeOmnichannel.content.btnCloseChat.click();
			await agent.poHomeOmnichannel.content.inputModalClosingComment.type('any_comment');
			await agent.poHomeOmnichannel.content.btnModalConfirm.click();
			await expect(agent.poHomeOmnichannel.toastSuccess).toBeVisible();
		});
	});
});
