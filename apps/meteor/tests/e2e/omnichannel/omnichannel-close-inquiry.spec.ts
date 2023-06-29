import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('Omnichannel close inquiry', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};

		await api.post('/livechat/users/manager', { username: 'user1' });
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' }).then((res) => expect(res.status()).toBe(200));

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
	});
	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }).then((res) => expect(res.status()).toBe(200)),
			await api.delete('/livechat/users/agent/user1'),
			await api.delete('/livechat/users/manager/user1'),
		]);
		await agent.page.close();
	});

	test('Receiving a message from visitor', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newUser, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openQueuedOmnichannelChat(newUser.name);
			await expect(agent.poHomeOmnichannel.content.takeOmnichannelChatButton).toBeVisible();
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
			await agent.poHomeOmnichannel.currentChats.openChat(newUser.name);
			await expect(agent.poHomeOmnichannel.content.takeOmnichannelChatButton).not.toBeVisible();
		});
	});
});
