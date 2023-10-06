import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('omnichannel-transfer-to-another-agent', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent1: { page: Page; poHomeOmnichannel: HomeOmnichannel };
	let agent2: { page: Page; poHomeOmnichannel: HomeOmnichannel };
	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }).then((res) => expect(res.status()).toBe(200)),
			api.post('/livechat/users/agent', { username: 'user2' }).then((res) => expect(res.status()).toBe(200)),
			api.post('/livechat/users/manager', { username: 'user1' }).then((res) => expect(res.status()).toBe(200)),
			api.post('/settings/Livechat_enabled_when_agent_idle', { value: false }).then((res) => expect(res.status()).toBe(200)),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent1 = { page, poHomeOmnichannel: new HomeOmnichannel(page) };

		const { page: page2 } = await createAuxContext(browser, Users.user2);
		agent2 = { page: page2, poHomeOmnichannel: new HomeOmnichannel(page2) };
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			api.delete('/livechat/users/agent/user1').then((res) => expect(res.status()).toBe(200)),
			api.delete('/livechat/users/manager/user1').then((res) => expect(res.status()).toBe(200)),
			api.delete('/livechat/users/agent/user2').then((res) => expect(res.status()).toBe(200)),
			api.post('/settings/Livechat_enabled_when_agent_idle', { value: true }).then((res) => expect(res.status()).toBe(200)),
		]);

		await agent1.page.close();
		await agent2.page.close();
	});
	test.beforeEach(async ({ page, api }) => {
		// make "user-1" online & "user-2" offline so that chat can be automatically routed to "user-1"
		await agent1.poHomeOmnichannel.sidenav.switchStatus('online');
		await agent2.poHomeOmnichannel.sidenav.switchStatus('offline');

		// start a new chat for each test
		newVisitor = {
			name: faker.person.firstName(),
			email: faker.internet.email(),
		};
		poLiveChat = new OmnichannelLiveChat(page, api);
		await page.goto('/livechat');
		await poLiveChat.openLiveChat();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
		await poLiveChat.btnSendMessageToOnlineAgent.click();
	});

	test('transfer omnichannel chat to another agent', async () => {
		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent1.poHomeOmnichannel.sidenav.getSidebarItemByName(newVisitor.name).click();
		});

		await test.step('Expect to not be able to transfer chat to "user-2" when that user is offline', async () => {
			await agent2.poHomeOmnichannel.sidenav.switchStatus('offline');

			await agent1.poHomeOmnichannel.content.btnForwardChat.click();
			await agent1.poHomeOmnichannel.content.inputModalAgentUserName.type('user2');
			await expect(agent1.page.locator('text=Empty')).toBeVisible();

			await agent1.page.goto('/');
		});

		await test.step('Expect to be able to transfer an omnichannel to conversation to agent 2 as agent 1 when agent 2 is online', async () => {
			await agent2.poHomeOmnichannel.sidenav.switchStatus('online');

			await agent1.poHomeOmnichannel.sidenav.getSidebarItemByName(newVisitor.name).click();
			await agent1.poHomeOmnichannel.content.btnForwardChat.click();
			await agent1.poHomeOmnichannel.content.inputModalAgentUserName.type('user2');
			await agent1.page.locator('.rcx-option .rcx-option__wrapper >> text="user2"').click();
			await agent1.poHomeOmnichannel.content.inputModalAgentForwardComment.type('any_comment');
			await agent1.poHomeOmnichannel.content.btnModalConfirm.click();
			await expect(agent1.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 2', async () => {
			await agent2.poHomeOmnichannel.sidenav.getSidebarItemByName(newVisitor.name).click();
		});
	});
});
