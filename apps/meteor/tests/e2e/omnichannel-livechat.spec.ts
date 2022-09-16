import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { HomeChannel, OmnichannelLiveChat } from './page-objects';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	return { page, poHomeChannel };
};

const newUser = {
	name: faker.name.firstName(),
	email: faker.internet.email(),
};
test.describe('Livechat', () => {
	test.describe('Send message', () => {
		let poAuxContext: { page: Page; poHomeChannel: HomeChannel };
		let poLiveChat: OmnichannelLiveChat;
		let page: Page;

		test.beforeAll(async ({ browser, api }) => {
			await api.post('/livechat/users/agent', { username: 'user1' });

			page = await browser.newPage();
			poLiveChat = new OmnichannelLiveChat(page);
			poAuxContext = await createAuxContext(browser, 'user1-session.json');

			await page.goto('/livechat');
		});

		test.afterAll(async () => {
			await poAuxContext.page.close();
		});

		test.describe('Send message to online agent', () => {
			test('expect message is sended by livechat', async () => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await poLiveChat.sendMessage(newUser, false);

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await expect(page.locator('div >>text="this_a_test_message_from_user"')).toBeVisible();
			});

			test('expect message is received by agent', async () => {
				await poAuxContext.poHomeChannel.sidenav.openChat(newUser.name);
				await expect(poAuxContext.poHomeChannel.content.lastUserMessage).toBeVisible();
				await expect(poAuxContext.poHomeChannel.content.lastUserMessage).toContainText('this_a_test_message_from_user');
			});
		});

		test.describe('Send message to livechat costumer', () => {
			test('expect message is sended by agent', async () => {
				await poAuxContext.poHomeChannel.content.sendMessage('this_a_test_message_from_agent');
				await expect(page.locator('div >>text="this_a_test_message_from_agent"')).toBeVisible();
			});

			test("expect after user minimize livechat screen don't show composer", async () => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
			});

			test('expect message is received by minimized livechat', async () => {
				await poAuxContext.poHomeChannel.content.sendMessage('this_a_test_message_again_from_agent');
				await expect(poLiveChat.unreadMessagesBadge).toBeVisible();
			});

			test('expect unread messages be visible after a reload', async () => {
				await page.reload();
				await expect(poLiveChat.unreadMessagesBadge).toBeVisible();
			});
		});
	});
});
