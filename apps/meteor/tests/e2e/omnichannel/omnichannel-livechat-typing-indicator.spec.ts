import type { Page } from 'playwright-core';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { OmnichannelLiveChat } from '../page-objects/omnichannel';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe.serial('OC - Livechat - Typing indicator', () => {
	let poLiveChat: OmnichannelLiveChat;
	let poHomeOmnichannel: HomeOmnichannel;
	let livechatPage: Page;

	test.beforeAll(async ({ api }) => {
		const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);
	});

	test.beforeAll(async ({ browser, api }) => {
		({ page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false));
		poLiveChat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeOmnichannel = new HomeOmnichannel(page);
		await page.goto('/');
		await poHomeOmnichannel.waitForHome();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([api.delete('/livechat/users/agent/user1'), livechatPage.close()]);
	});

	test('OC - Livechat - Visitor/Agent types and sees typing indicator', async () => {
		await test.step('expect conversation to be started', async () => {
			await poLiveChat.page.reload();
			await poLiveChat.openAnyLiveChatAndSendMessage({
				liveChatUser: visitor,
				message: 'Hello, I need help',
				isOffline: false,
			});
			await poHomeOmnichannel.navbar.openChat(visitor.name);
			await expect(poHomeOmnichannel.content.lastUserMessage).toBeVisible();
		});

		await test.step('expect agent to see typing indicator when visitor types', async () => {
			await poLiveChat.onlineAgentMessage.pressSequentially('abc', { delay: 20 });
			await expect(poHomeOmnichannel.composer.typingIndicator).toBeVisible();
		});

		await test.step('expect visitor to see typing indicator when agent types', async () => {
			await poHomeOmnichannel.composer.inputMessage.pressSequentially('xyz', { delay: 20 });
			await expect(poLiveChat.typingIndicatorForVisitor).toBeVisible();
		});
	});
});
