import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat } from './page-objects';
import { createAuxContext } from './utils';

test.describe.only('Livechat', () => {
	let poLiveChat: OmnichannelLiveChat;

	test.beforeEach(async ({ page }) => {
		await page.goto('/livechat');

		poLiveChat = new OmnichannelLiveChat(page);
	});

	test.skip('expect send message to live chat', async () => {
		const newUser = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};
		await poLiveChat.btnOpenLiveChat('L').click();
		await poLiveChat.doSendMessage(newUser);
	});

	test.describe('Send message to online agent', () => {
		let auxContext: any;

		test.beforeAll(async ({ browser, api }) => {
			await api.post('/livechat/users/agent', { username: 'user1' });

			auxContext = await createAuxContext(browser, 'user1-session.json');
		});

		test('expect message is received from agent and user ', async ({ page }) => {
			const newUser = {
				name: faker.name.firstName(),
				email: faker.internet.email(),
			};

			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.doSendMessage(newUser, false);

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			auxContext.poHomeChannel.sidenav.openChat(newUser.name);
			await auxContext.poHomeChannel.content.sendMessage('this_a_test_message_from_agent');

			await expect(auxContext.poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(auxContext.poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(page.locator('div >>text="this_a_test_message_from_user"')).toBeVisible();
			await expect(page.locator('div >>text="this_a_test_message_from_agent"')).toBeVisible();
		});

		test('expect after user close live chat screen dont show messages', async ({ page }) => {
			await poLiveChat.btnOpenLiveChat('R').click();
			await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
		});

		test.describe.skip('[Not allow close]', () => {
			test.skip(!true, 'verify agent is not allowed to close chat');

			test.beforeEach(async () => {
				//
			});
		});
	});
});
