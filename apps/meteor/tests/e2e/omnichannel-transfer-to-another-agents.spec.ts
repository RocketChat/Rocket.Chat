import { faker } from '@faker-js/faker';
import type { Browser, Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelLiveChat, HomeChannel } from './page-objects';

const createAuxContext = async (browser: Browser, storageState: string): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/');
	await page.locator('.main-content').waitFor();

	return { page, poHomeChannel };
};

test.describe('omnichannel-transfer-to-another-agent', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent1: { page: Page; poHomeChannel: HomeChannel };
	let agent2: { page: Page; poHomeChannel: HomeChannel };
	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		let statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
		expect(statusCode).toBe(200);
		statusCode = (await api.post('/livechat/users/agent', { username: 'user2' })).status();
		expect(statusCode).toBe(200);
		statusCode = (await api.post('/livechat/users/manager', { username: 'user1' })).status();
		expect(statusCode).toBe(200);

		// turn off setting which allows offline agents to chat
		statusCode = (await api.post('/settings/Livechat_enabled_when_agent_idle', { value: false })).status();
		expect(statusCode).toBe(200);

		agent1 = await createAuxContext(browser, 'user1-session.json');
		agent2 = await createAuxContext(browser, 'user2-session.json');
	});
	test.beforeEach(async ({ page }) => {
		// make "user-1" online & "user-2" offline so that chat can be automatically routed to "user-1"
		await agent1.poHomeChannel.sidenav.switchStatus('online');
		await agent2.poHomeChannel.sidenav.switchStatus('offline');

		// start a new chat for each test
		newVisitor = {
			name: faker.name.firstName(),
			email: faker.internet.email(),
		};
		poLiveChat = new OmnichannelLiveChat(page);
		await page.goto('/livechat');
		await poLiveChat.btnOpenLiveChat('R').click();
		await poLiveChat.sendMessage(newVisitor, false);
		await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
		await poLiveChat.btnSendMessageToOnlineAgent.click();
	});

	test.afterAll(async ({ api }) => {
		// delete "user-1" & "user-2" from agents & managers
		let statusCode = (await api.delete('/livechat/users/agent/user1')).status();
		expect(statusCode).toBe(200);
		statusCode = (await api.delete('/livechat/users/manager/user1')).status();
		expect(statusCode).toBe(200);
		statusCode = (await api.delete('/livechat/users/agent/user2')).status();
		expect(statusCode).toBe(200);

		// turn on setting which allows offline agents to chat
		statusCode = (await api.post('/settings/Livechat_enabled_when_agent_idle', { value: true })).status();
		expect(statusCode).toBe(200);
	});

	test('transfer omnichannel chat to another agent', async () => {
		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent1.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('Expect to not be able to transfer chat to "user-2" when that user is offline', async () => {
			await agent2.poHomeChannel.sidenav.switchStatus('offline');

			await agent1.poHomeChannel.content.btnForwardChat.click();
			await agent1.poHomeChannel.content.inputModalAgentUserName.type('user2');
			await expect(agent1.page.locator('text=Empty')).toBeVisible();

			await agent1.page.goto('/');
		});

		await test.step('Expect to be able to transfer an omnichannel to conversation to agent 2 as agent 1 when agent 2 is online', async () => {
			await agent2.poHomeChannel.sidenav.switchStatus('online');

			await agent1.poHomeChannel.sidenav.openChat(newVisitor.name);
			await agent1.poHomeChannel.content.btnForwardChat.click();
			await agent1.poHomeChannel.content.inputModalAgentUserName.type('user2');
			await agent1.page.locator('.rcx-option .rcx-option__wrapper >> text="user2"').click();
			await agent1.poHomeChannel.content.inputModalAgentForwardComment.type('any_comment');
			await agent1.poHomeChannel.content.btnModalConfirm.click();
			await expect(agent1.poHomeChannel.toastSuccess).toBeVisible();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 2', async () => {
			await agent2.poHomeChannel.sidenav.openChat(newVisitor.name);
		});
	});
});
