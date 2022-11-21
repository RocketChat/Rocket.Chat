import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { HomeOmnichannel, OmnichannelLiveChat } from './page-objects';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeOmnichannel: HomeOmnichannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeOmnichannel = new HomeOmnichannel(page);
	await page.goto('/');
	return { page, poHomeOmnichannel };
};

const newUser = {
	name: faker.name.firstName(),
	email: faker.internet.email(),
};
test.describe('Livechat', () => {
	test.describe('Send message', () => {
		let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };
		let poLiveChat: OmnichannelLiveChat;
		let page: Page;

		test.beforeAll(async ({ browser, api }) => {
			const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
			expect(statusCode).toBe(200);

			page = await browser.newPage();
			poLiveChat = new OmnichannelLiveChat(page);
			poAuxContext = await createAuxContext(browser, 'user1-session.json');

			await page.goto('/livechat');
		});

		test.afterAll(async ({ api }) => {
			await api.delete('/livechat/users/agent/user1');
			await poAuxContext.page.close();
		});

		test('Send message to online agent', async () => {
			await test.step('Expect message to be sent by livechat', async () => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await poLiveChat.sendMessage(newUser, false);

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await expect(page.locator('div >>text="this_a_test_message_from_user"')).toBeVisible();
			});

			await test.step('expect message to be received by agent', async () => {
				await poAuxContext.poHomeOmnichannel.sidenav.openChat(newUser.name);
				await expect(poAuxContext.poHomeOmnichannel.content.lastUserMessage).toBeVisible();
				await expect(poAuxContext.poHomeOmnichannel.content.lastUserMessage).toContainText('this_a_test_message_from_user');
			});
		});

		test('Send message to livechat costumer', async () => {
			await test.step('Expect message to be sent by agent', async () => {
				await poAuxContext.poHomeOmnichannel.content.sendMessage('this_a_test_message_from_agent');
				await expect(page.locator('div >>text="this_a_test_message_from_agent"')).toBeVisible();
			});

			await test.step('Expect when user minimizes the livechat screen, the composer should be hidden', async () => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
			});

			await test.step('expect message to be received by minimized livechat', async () => {
				await poAuxContext.poHomeOmnichannel.content.sendMessage('this_a_test_message_again_from_agent');
				await expect(poLiveChat.unreadMessagesBadge(1)).toBeVisible();
			});

			await test.step('expect unread messages to be visible after a reload', async () => {
				await page.reload();
				await expect(poLiveChat.unreadMessagesBadge(1)).toBeVisible();
			});
		});

		test.describe('close livechat conversation', () => {
			test('expect livechat conversation to be closed by agent', async () => {
				await poAuxContext.poHomeOmnichannel.content.btnCloseChat.click();
				await poAuxContext.poHomeOmnichannel.content.omnichannelCloseChatModal.inputComment.fill('this_is_a_test_comment');
				await poAuxContext.poHomeOmnichannel.content.omnichannelCloseChatModal.btnConfirm.click();
				await expect(poAuxContext.poHomeOmnichannel.toastSuccess).toBeVisible();
			});
		});
	});
});
