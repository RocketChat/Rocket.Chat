import { test, Page, expect, APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { BASE_API_URL, ADMIN_CREDENTIALS } from './config/constants';
import { OmnichannelLiveChat } from './page-objects';

const apiSessionHeaders = { 'X-Auth-Token': '', 'X-User-Id': '' };

const makeLogin = async (request: APIRequestContext): Promise<void> => {
	const response = await request.post(`${BASE_API_URL}/login`, { data: ADMIN_CREDENTIALS });

	const { userId, authToken } = (await response.json()).data;

	apiSessionHeaders['X-Auth-Token'] = authToken;
	apiSessionHeaders['X-User-Id'] = userId;
};

const addAgent = async (request: APIRequestContext): Promise<void> => {
	await request.post(`${BASE_API_URL}/livechat/users/agent`, {
		headers: apiSessionHeaders,
		data: { username: 'user3' },
	});
};

test.describe.only('Livechat', () => {
	let liveChat: OmnichannelLiveChat;

	test.describe('[Offline message]', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/livechat');

			liveChat = new OmnichannelLiveChat(page);
			await liveChat.btnOpenLiveChat('L').click();
		});

		test('expect send message to live chat', async () => {
			const newUser = {
				name: faker.name.firstName(),
				email: faker.internet.email(),
			};

			await liveChat.doSendMessage(newUser);

			await expect(something).toBeVisible();
		});
	});

	test.describe('[Send message to online agent]', () => {
		let otherContextPage: Page;
		test.beforeEach(async ({ request }) => {
			await makeLogin(request);
			await addAgent(request);

			await page.goto('/livechat');
			await liveChat.btnOpenLiveChat('R').click();
			await liveChat.doSendMessage(liveChatUser, false);
			await liveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await liveChat.btnSendMessageToOnlineAgent.click();

			await mainContent.sendMessage('this_a_test_message_from_agent');
		});

		test.afterAll(async () => {
			await otherContextPage.close();
		});

		test('expect message is received from agent', async () => {
			await expect(mainContent.page.locator('[data-qa-type="message"][data-own="false"]').last()).toBeVisible();
			await expect(mainContent.page.locator('[data-qa-type="message"][data-own="true"]')).toBeVisible();
		});

		test('expect message is received from user in livechat', async () => {
			await expect(page.locator('div >>text="this_a_test_message_from_user"')).toBeVisible();
			await expect(page.locator('div >>text="this_a_test_message_from_agent"')).toBeVisible();
		});

		test('expect after user close live chat screen dont show messages', async () => {
			await liveChat.btnOpenLiveChat('R').click();
			await expect(page.locator('[contenteditable="true"]')).not.toBeVisible();
		});

		test.describe('[Not allow close]', () => {
			test.skip(!IS_EE, 'verify agent is not allowed to close chat');

			test.beforeAll(async () => {
				// await loginPage.doLogout();
				await loginPage.doLogin(adminLogin);

				const sideNav = new SideNav(otherContextPage);
				await sideNav.sidebarUserMenu.click();
				await agent.agentInfo.click();
				await sideNav.admin.click();
				await sideNav.linkSettings.click();
				await mainContent.inputSearchSettings.type('Omnichannel');

				await mainContent.btnOpenOmnichannelConfig.click();
				await mainContent.session.click();
				await mainContent.setToHold.click();
				await mainContent.btnSaveChanges.click();
				await otherContextPage.goto('/');

				await loginPage.logout();

				await loginPage.login(validUserInserted);
				await agent.clickOnLiveChatCall(liveChatUser.name).click();
			});

			// test('verify that agent is not allows to close a chat', async () => {});
		});

		// test('verify that agent is allowed to close a chat', async () => {
		// 	await mainContent.closeLiveChatConversation();
		// 	await expect(agent.clickOnLiveChatCall(liveChatUser.name)).not.toBeVisible();
		// });
	});
});
