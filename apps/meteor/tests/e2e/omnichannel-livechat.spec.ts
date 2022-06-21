import { test, Page, expect, APIRequestContext } from '@playwright/test';

import { updateMailToLiveChat } from './utils/helpers/updateMailToLiveChat';
import { verifyTestBaseUrl } from './utils/configs/verifyTestBaseUrl';
import { LoginPage, MainContent, Agents, LiveChat } from './pageobjects';
import { createRegisterUser, validUserInserted, adminLogin } from './utils/mocks/userAndPasswordMock';
import { BASE_API_URL } from './utils/mocks/urlMock';

const apiSessionHeaders = { 'X-Auth-Token': '', 'X-User-Id': '' };

const makeLogin = async (request: APIRequestContext): Promise<void> => {
	const response = await request.post(`${BASE_API_URL}/login`, { data: adminLogin });

	const { userId, authToken } = (await response.json()).data;

	apiSessionHeaders['X-Auth-Token'] = authToken;
	apiSessionHeaders['X-User-Id'] = userId;
};

const addAgent = async (request: APIRequestContext): Promise<void> => {
	await request.post(`${BASE_API_URL}/livechat/users/agent`, {
		headers: apiSessionHeaders,
		data: { username: 'user.name.test' },
	});
};

test.describe('[Livechat]', () => {
	let page: Page;
	let liveChat: LiveChat;
	const liveChatUser = createRegisterUser();
	test.afterAll(async () => {
		await page.close();
	});
	test.describe('[Offline message]', () => {
		test.beforeAll(async ({ browser }) => {
			const { isLocal } = verifyTestBaseUrl();

			if (isLocal) {
				await updateMailToLiveChat();
			}
			page = await browser.newPage();
			const liveChatUrl = '/livechat';
			await page.goto(liveChatUrl);

			liveChat = new LiveChat(page);
			await liveChat.btnOpenLiveChat('L').click();
		});

		test.describe('[Render]', () => {
			test('expect show all inputs', async () => {
				await liveChat.renderAllElements();
			});
		});

		test.describe('[Actions]', () => {
			test('expect send message to live chat', async () => {
				await liveChat.doSendMessage(liveChatUser);
			});
		});
	});

	test.describe('[Send message to online agent]', () => {
		let loginPage: LoginPage;
		let mainContent: MainContent;
		let agent: Agents;
		let otherContextPage: Page;
		test.beforeAll(async ({ browser, request }) => {
			const context = await browser.newContext();
			otherContextPage = await context.newPage();
			await otherContextPage.goto('/');
			await makeLogin(request);
			await addAgent(request);
			loginPage = new LoginPage(otherContextPage);
			mainContent = new MainContent(otherContextPage);
			agent = new Agents(otherContextPage);

			await loginPage.login(validUserInserted);

			await page.reload();
			await liveChat.btnOpenLiveChat('R').click();
			await liveChat.doSendMessage(liveChatUser, false);
			await liveChat.onlineAgentMessage.type('this_a_test_message_from_user');
			await liveChat.btnSendMessageToOnlineAgent.click();

			await agent.clickOnLiveChatCall(liveChatUser.name).click();

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

		// test('verify agent is not allowed to close chat', async () => {});

		test('verify that agent is allowed to close a chat', async () => {
			await mainContent.closeLiveChatConversation();
			await expect(agent.clickOnLiveChatCall(liveChatUser.name)).not.toBeVisible();
		});
	});
});
