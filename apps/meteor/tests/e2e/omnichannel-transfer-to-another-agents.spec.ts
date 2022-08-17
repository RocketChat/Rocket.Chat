import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeChannel } from './page-objects';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	return { page, poHomeChannel };
};

test.describe('omnichannel-departaments', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };
	test.beforeAll(async ({ api }) => {
		newUser = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
	});

	test.describe('Receiving message from user', () => {
		let auxContext1: { page: Page; poHomeChannel: HomeChannel };
		test.beforeEach(async ({ browser, api, page }) => {
			await api.post('/livechat/users/agent', { username: 'user2' });
			auxContext1 = await createAuxContext(browser, 'user1-session.json');
			await page.goto('/livechat');
			poLiveChat = new OmnichannelLiveChat(page);
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(newUser, false);

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		test('transfer chat to another agent', async ({ browser }) => {
			const auxContext2 = await createAuxContext(browser, 'user2-session.json');

			await auxContext1.poHomeChannel.sidenav.openChat(newUser.name);
			await auxContext1.poHomeChannel.content.btnForwardChat.click();
			await auxContext1.poHomeChannel.content.inputModalAgentUserName.type('user2');
			await auxContext1.page.locator('.rcx-option .rcx-option__wrapper >> text="user2"').click();
			await auxContext1.poHomeChannel.content.inputModalAgentForwardComment.type('any_comment');
			await auxContext1.poHomeChannel.content.btnModalConfirm.click();

			await expect(auxContext1.poHomeChannel.toastSuccess).toBeVisible();
			await auxContext1.page.close();
			await auxContext2.page.close();
		});
	});

	test.describe('verify if chat is transfer', async () => {
		test.use({ storageState: 'user2-session.json' });
		test('verify is chat is transfered', async ({ page }) => {
			await page.goto('/');
			const poHomeChannel = new HomeChannel(page);
			await poHomeChannel.sidenav.openChat(newUser.name);
			await expect(page.locator(`[data-qa="sidebar-item-title"] >> text="${newUser.name}"`)).toBeVisible();
		});
	});
});
