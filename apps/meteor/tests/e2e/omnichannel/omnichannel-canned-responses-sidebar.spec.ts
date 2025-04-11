import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test } from '../utils/test';

test.describe.serial('OC - Canned Responses Sidebar', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeOmnichannel };

	const cannedResponseName = faker.string.uuid();

	test.beforeAll(async ({ api, browser }) => {
		newVisitor = createFakeVisitor();

		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeOmnichannel(page) };
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll('close livechat conversation', async () => {
		await agent.poHomeChannel.content.closeChat();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await poLiveChat.page.close();
		await agent.page.close();
	});

	test('OC - Canned Responses Sidebar - Create', async ({ page }) => {
		await test.step('expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('expect to be able to open canned responses sidebar and creation', async () => {
			await agent.poHomeChannel.content.btnCannedResponses.click();
		});

		await test.step('expect to create new canned response', async () => {
			await agent.poHomeChannel.content.btnNewCannedResponse.click();
			await agent.poHomeChannel.cannedResponses.inputShortcut.fill(cannedResponseName);
			await agent.poHomeChannel.cannedResponses.inputMessage.fill(faker.lorem.paragraph());
			await agent.poHomeChannel.cannedResponses.addTag(faker.commerce.department());
			await agent.poHomeChannel.cannedResponses.radioPublic.click();
			await agent.poHomeChannel.cannedResponses.btnSave.click();
		});
	});

	test('OC - Canned Responses Sidebar - Edit', async () => {
		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('expect to be able to open canned responses sidebar and creation', async () => {
			await agent.poHomeChannel.content.btnCannedResponses.click();
		});

		await test.step('expect to edit canned response', async () => {
			await agent.poHomeChannel.cannedResponses.listItem(cannedResponseName).click();
			await agent.poHomeChannel.cannedResponses.btnEdit.click();
			await agent.poHomeChannel.cannedResponses.radioPrivate.click();
			await agent.poHomeChannel.cannedResponses.btnSave.click();
		});
	});
});
