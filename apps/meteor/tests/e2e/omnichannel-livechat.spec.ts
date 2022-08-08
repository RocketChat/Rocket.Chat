import { test, expect, APIRequestContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { BASE_API_URL, ADMIN_CREDENTIALS, IS_EE } from './config/constants';
import { OmnichannelLiveChat } from './page-objects';
import { createAuxContext } from './utils';

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
		test.beforeEach(async ({ page }) => {
			await page.goto('/livechat');
		});

		test.beforeAll(async ({ browser, request }) => {
			await makeLogin(request);
			await addAgent(request);
			auxContext = await createAuxContext(browser, 'user3-session.json');
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

		test.describe('[Not allow close]', () => {
			test.skip(!IS_EE, 'verify agent is not allowed to close chat');

			test.beforeEach(async () => {
				//
			});
		});
	});
});
