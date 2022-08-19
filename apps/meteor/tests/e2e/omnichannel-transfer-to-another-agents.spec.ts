import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeChannel } from './page-objects';
<<<<<<< HEAD
import { createAuxContext } from './utils';
=======

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	await page.locator('.main-content').waitFor();

	return { page, poHomeChannel };
};
>>>>>>> develop

test.describe('omnichannel-departments', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newUser: { email: string; name: string };

	let agent1: { page: Page; poHomeChannel: HomeChannel };
	let agent2: { page: Page; poHomeChannel: HomeChannel };
	test.beforeAll(async ({ api, browser }) => {
		newUser = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};

		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
		agent1 = await createAuxContext(browser, 'user1-session.json');
	});
	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChat(page);
	});

<<<<<<< HEAD
	test.describe('Receiving message from user', () => {
		let auxContext: { page: Page; poHomeChannel: HomeChannel };

		test.beforeEach(async ({ api, page }) => {
			await api.post('/login', {
				email: 'user1@email.com',
				password: 'any_password',
			});

=======
	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');

		await api.delete('/livechat/users/agent/user2');
	});

	test('Receiving a message from visitor', async ({ browser, api, page }) => {
		await test.step('Expect send a message as a visitor', async () => {
>>>>>>> develop
			await page.goto('/livechat');
			await poLiveChat.btnOpenLiveChat('R').click();
			await poLiveChat.sendMessage(newUser, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
<<<<<<< HEAD
			await api.post('/livechat/users/agent', { username: 'user2' });
=======
			// Set user user 2 as agent
>>>>>>> develop
		});
		test.use({ storageState: 'user1-session.json' });
		test('transfer chat to another agent', async ({ page, browser }) => {
			await page.goto('/');
			auxContext = await createAuxContext(browser, 'user2-session.json');

<<<<<<< HEAD
			const poHomeChannel = new HomeChannel(page);

			await poHomeChannel.sidenav.openChat(newUser.name);
			await poHomeChannel.content.btnForwardChat.click();
			await poHomeChannel.content.inputModalAgentUserName.type('user2');
			await page.locator('.rcx-option .rcx-option__wrapper >> text="user2"').click();
			await poHomeChannel.content.inputModalAgentForwardComment.type('any_comment');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await auxContext.page.close();
=======
		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent1.poHomeChannel.sidenav.openChat(newUser.name);
		});

		await test.step('Expect to connect as agent 2', async () => {
			agent2 = await createAuxContext(browser, 'user2-session.json');
			// TODO: We cannot assign a user as agent before, because now the agent can be assigned even offline, since we dont have endpoint to turn agent offline I'm doing this :x
			await api.post('/livechat/users/agent', { username: 'user2' });
		});
		await test.step('Expect to be able to transfer an omnichannel to conversation to agent 2 as agent 1', async () => {
			await agent1.poHomeChannel.content.btnForwardChat.click();
			await agent1.poHomeChannel.content.inputModalAgentUserName.type('user2');
			await agent1.page.locator('.rcx-option .rcx-option__wrapper >> text="user2"').click();
			await agent1.poHomeChannel.content.inputModalAgentForwardComment.type('any_comment');
			await agent1.poHomeChannel.content.btnModalConfirm.click();
			await expect(agent1.poHomeChannel.toastSuccess).toBeVisible();
>>>>>>> develop
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 2', async () => {
			await agent2.poHomeChannel.sidenav.openChat(newUser.name);
		});
	});
});
