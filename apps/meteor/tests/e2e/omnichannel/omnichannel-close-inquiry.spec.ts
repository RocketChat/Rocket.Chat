import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('Omnichannel close inquiry', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api }) => {
		newVisitor = createFakeVisitor();

		await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' }).then((res) => expect(res.status()).toBe(200));
		await api.post('/livechat/users/manager', { username: 'user1' });
		await api.post('/livechat/users/agent', { username: 'user1' });
	});

	test.beforeEach(async ({ page, api, browser }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);

		const { page: auxPage } = await createAuxContext(browser, Users.user1);
		agent = { page: auxPage, poHomeOmnichannel: new HomeOmnichannel(auxPage) };
	});

	test.afterEach(async () => {
		await agent.page.close();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }).then((res) => expect(res.status()).toBe(200)),
			await api.delete('/livechat/users/agent/user1'),
			await api.delete('/livechat/users/manager/user1'),
		]);
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
			await agent.poHomeOmnichannel.sidenav.getQueuedChat(newVisitor.name).click();
			await expect(agent.poHomeOmnichannel.content.btnTakeChat).toBeVisible();
		});

		await test.step('Expect to be able to close an inquiry conversation', async () => {
			await agent.poHomeOmnichannel.content.btnCloseChat.click();
			await agent.poHomeOmnichannel.content.inputModalClosingComment.type('any_comment');
			await agent.poHomeOmnichannel.content.btnModalConfirm.click();
			await expect(agent.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('Expect to inquiry be closed when navigate back', async () => {
			await agent.poHomeOmnichannel.sidenav.openAdministrationByLabel('Omnichannel');
			await agent.poHomeOmnichannel.omnisidenav.linkCurrentChats.click();
			await agent.poHomeOmnichannel.currentChats.findRowByName(newVisitor.name).click();
			await expect(agent.poHomeOmnichannel.content.btnTakeChat).not.toBeVisible();
		});
	});
});
