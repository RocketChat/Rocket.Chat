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

const testImg = 'https://assets-global.website-files.com/611a19b9853b7414a0f6b3f6/6132017c7a979557454a1bf2_favicon%2032px.png';
test.describe('Livechat', () => {
	test.describe('Send message from user', () => {
		let poLiveChat: OmnichannelLiveChat;

		test.beforeEach(async ({ page }) => {
			await page.goto('/livechat');

			poLiveChat = new OmnichannelLiveChat(page);
		});

		test('expect send message to livechat', async () => {
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(newUser, false);
		});

		test.describe('Send message to online agent', () => {
			let poAuxContext: { page: Page; poHomeChannel: HomeChannel };
			test.beforeAll(async ({ browser, api }) => {
				await api.post('/livechat/users/agent', { username: 'user1' });

				poAuxContext = await createAuxContext(browser, 'user1-session.json');
			});

			test.afterAll(async () => {
				await poAuxContext.page.close();
			});

			test('expect message is received from agent and user ', async ({ page }) => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await poLiveChat.sendMessage(newUser, false);

				await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await expect(page.locator('div >>text="this_a_test_message_from_user"')).toBeVisible();
			});

			test('expect after user close live chat screen dont show messages', async ({ page }) => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
			});
		});
		test.describe('Verify message is received', () => {
			test.use({ storageState: 'user1-session.json' });
			test('expect message is received from user', async ({ page }) => {
				await page.goto('/');
				const poHomeChannel = new HomeChannel(page);
				await poHomeChannel.sidenav.openQueuedOmnichannelChat(newUser.name, true);
				await expect(poHomeChannel.content.lastUserMessageNotSequential).toBeVisible();
				await expect(poHomeChannel.content.lastUserMessageNotSequential).toContainText('this_a_test_message_from_user');
			});
		});
		test.describe('Send markdown message to online agent', () => {
			let poAuxContext: { page: Page; poHomeChannel: HomeChannel };
			test.beforeAll(async ({ browser, api }) => {
				await api.post('/livechat/users/agent', { username: 'user1' });

				poAuxContext = await createAuxContext(browser, 'user1-session.json');
			});

			test.afterAll(async () => {
				await poAuxContext.page.close();
			});

			test('expect image-containing markdown to be received from agent and user ', async ({ page }) => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await poLiveChat.sendMessage(newUser, false);

				await poLiveChat.onlineAgentMessage.type(`![image_test](${testImg})`);
				await poLiveChat.btnSendMessageToOnlineAgent.click();

				await expect(page.locator(`img[src="${testImg}"]`)).toBeVisible();
			});

			test('expect after user close live chat screen dont show messages', async ({ page }) => {
				await poLiveChat.btnOpenLiveChat('R').click();
				await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
			});
		});
		test.describe('Verify markdown message is received', () => {
			test.use({ storageState: 'user1-session.json' });
			test('expect message is received from user', async ({ page }) => {
				await page.goto('/');
				const poHomeChannel = new HomeChannel(page);
				await poHomeChannel.sidenav.openQueuedOmnichannelChat(newUser.name, true);
				await expect(poHomeChannel.content.lastUserMessageNotSequential).toBeVisible();
				await expect(poHomeChannel.content.lastUserMessageNotSequential).toContainText('image_test');
			});
		});
	});
});
