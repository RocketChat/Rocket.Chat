import { faker } from '@faker-js/faker';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { test, expect } from '../utils/test';

const newUser = {
	name: `${faker.person.firstName()} ${faker.string.uuid()}}`,
	email: faker.internet.email(),
};

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Livechat', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;

	test.beforeAll(async ({ api }) => {
		const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		await expect(statusCode).toBe(200);
	});

	test.beforeAll(async ({ browser, api }) => {
		const { page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false);

		poLiveChat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeOmnichannel = new HomeOmnichannel(page);

		await page.goto('/');
		await page.locator('.main-content').waitFor();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await poLiveChat.page?.close();
	});

	test('OC - Livechat - Send message to online agent', async () => {
		await test.step('expect message to be sent by livechat', async () => {
			await poLiveChat.page.reload();
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newUser, false);

			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();

			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect message to be received by agent', async () => {
			await poHomeOmnichannel.sidenav.openChat(newUser.name);
			await expect(poHomeOmnichannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeOmnichannel.content.lastUserMessage).toContainText('this_a_test_message_from_user');
		});
	});

	test('OC - Livechat - Send message to livechat costumer', async () => {
		await poHomeOmnichannel.sidenav.openChat(newUser.name);

		await test.step('expect message to be sent by agent', async () => {
			await poHomeOmnichannel.content.sendMessage('this_a_test_message_from_agent');
			await expect(poLiveChat.page.locator('div >> text="this_a_test_message_from_agent"')).toBeVisible();
		});

		await test.step('expect when user minimizes the livechat screen, the composer should be hidden', async () => {
			await poLiveChat.openLiveChat();
			await expect(poLiveChat.page.locator('[contenteditable="true"]')).not.toBeVisible();
		});

		await test.step('expect message to be received by minimized livechat', async () => {
			await poHomeOmnichannel.content.sendMessage('this_a_test_message_again_from_agent');
			await expect(poLiveChat.unreadMessagesBadge(1)).toBeVisible();
		});

		await test.step('expect unread messages to be visible after a reload', async () => {
			await poLiveChat.page.reload();
			await expect(poLiveChat.unreadMessagesBadge(1)).toBeVisible();
		});
	});

	test('OC - Livechat - Close livechat conversation', async () => {
		await poHomeOmnichannel.sidenav.openChat(newUser.name);

		await test.step('expect livechat conversation to be closed by agent', async () => {
			await poHomeOmnichannel.content.btnCloseChat.click();
			await poHomeOmnichannel.content.omnichannelCloseChatModal.inputComment.fill('this_is_a_test_comment');
			await poHomeOmnichannel.content.omnichannelCloseChatModal.btnConfirm.click();
			await expect(poHomeOmnichannel.toastSuccess).toBeVisible();
		});
	});
});
