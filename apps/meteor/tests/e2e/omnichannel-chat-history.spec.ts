import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeOmnichannel } from './page-objects';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeOmnichannel: HomeOmnichannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeOmnichannel = new HomeOmnichannel(page);
	await page.goto('/');
	await page.locator('.main-content').waitFor();

	return { page, poHomeOmnichannel };
};

test.describe('Omnichannel chat histr', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};

		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
		agent = await createAuxContext(browser, 'user1-session.json');
	});
	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChat(page);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
	});

	test('Receiving a message from visitor', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(newUser, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openChat(newUser.name);
		});

		await test.step('Expect to be able to close an omnichannel to conversation', async () => {
			await agent.poHomeOmnichannel.content.btnCloseChat.click();
			await agent.poHomeOmnichannel.content.inputModalClosingComment.type('any_comment');
			await agent.poHomeOmnichannel.content.btnModalConfirm.click();
			await expect(agent.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('Expect send a message as a visitor again to reopen chat', async () => {
			await page.goto('/livechat');
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openChat(newUser.name);
		});

		await test.step('Expect to be able to see conversation history', async () => {
			await agent.poHomeOmnichannel.btnCurrentChats.click();
			await expect(agent.poHomeOmnichannel.historyItem).toBeVisible();
			await agent.poHomeOmnichannel.historyItem.click();
			await expect(agent.poHomeOmnichannel.historyMessage).toBeVisible();
		});
	});
});
