import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('Omnichannel chat history', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		newVisitor = createFakeVisitor();

		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();

		await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'owner', 'moderator', 'user'] }] });
	});

	test('Receiving a message from visitor', async ({ page, api }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('expect to be able to edit room info', async () => {
			await agent.poHomeOmnichannel.roomInfo.btnEditRoomInfo.click();
			await agent.poHomeOmnichannel.roomInfo.inputTopic.fill('any_topic');
			await agent.poHomeOmnichannel.roomInfo.btnSaveEditRoom.click();

			await expect(agent.poHomeOmnichannel.roomInfo.dialogRoomInfo).toContainText('any_topic');
		});

		await test.step('Expect to be able to close an omnichannel to conversation', async () => {
			await agent.poHomeOmnichannel.content.btnCloseChat.click();
			await agent.poHomeOmnichannel.content.inputModalClosingComment.type('any_comment');
			await agent.poHomeOmnichannel.content.btnModalConfirm.click();
			await expect(agent.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('Expect send a message as a visitor again to reopen chat', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('Expect to be able to see conversation history', async () => {
			await agent.poHomeOmnichannel.btnContactInfo.click();
			await agent.poHomeOmnichannel.contacts.contactInfo.tabHistory.click();
			await expect(agent.poHomeOmnichannel.contacts.contactInfo.historyItem).toBeVisible();

			await agent.poHomeOmnichannel.contacts.contactInfo.historyItem.click();
			await expect(agent.poHomeOmnichannel.contacts.contactInfo.historyMessage).toBeVisible();
		});

		await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: [] }] });

		await test.step('Expect agent to see conversation history, but not join room', async () => {
			await agent.page.reload();

			await agent.poHomeOmnichannel.contacts.contactInfo.historyItem.click();
			await agent.poHomeOmnichannel.contacts.contactInfo.historyMessage.click();
			await agent.poHomeOmnichannel.contacts.contactInfo.btnOpenChat.click();

			// Should not show the NoSubscribedRoom.tsx component on livechat rooms
			await expect(agent.page.locator('div >> text=This conversation is already closed.')).toBeVisible();
			await expect(agent.page.locator('div >> text="this_a_test_message_from_visitor"')).toBeVisible();
		});
	});
});
