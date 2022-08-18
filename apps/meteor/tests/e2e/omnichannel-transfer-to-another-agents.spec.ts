import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeChannel } from './page-objects';
import { createAuxContext } from './utils';

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
		let auxContext: { page: Page; poHomeChannel: HomeChannel };

		test.beforeEach(async ({ api, page }) => {
			await api.post('/login', {
				email: 'user1@email.com',
				password: 'any_password',
			});

			await page.goto('/livechat');
			poLiveChat = new OmnichannelLiveChat(page);
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(newUser, false);

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await api.post('/livechat/users/agent', { username: 'user2' });
		});
		test.use({ storageState: 'user1-session.json' });
		test('transfer chat to another agent', async ({ page, browser }) => {
			await page.goto('/');
			auxContext = await createAuxContext(browser, 'user2-session.json');

			const poHomeChannel = new HomeChannel(page);

			await poHomeChannel.sidenav.openChat(newUser.name);
			await poHomeChannel.content.btnForwardChat.click();
			await poHomeChannel.content.inputModalAgentUserName.type('user2');
			await page.locator('.rcx-option .rcx-option__wrapper >> text="user2"').click();
			await poHomeChannel.content.inputModalAgentForwardComment.type('any_comment');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await auxContext.page.close();
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
