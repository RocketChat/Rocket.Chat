import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { OmnichannelContacts } from '../page-objects/omnichannel-contacts-list';
import { expect, test } from '../utils/test';

test.describe('Omnichannel contact info', () => {
	let poLiveChat: OmnichannelLiveChat;
	let newVisitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel; poContacts: OmnichannelContacts };

	test.beforeAll(async ({ api, browser }) => {
		newVisitor = createFakeVisitor();

		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeChannel(page), poContacts: new OmnichannelContacts(page) };
	});
	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
	});

	test('Receiving a message from visitor, and seeing its information', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(newVisitor, false);
			await poLiveChat.onlineAgentMessage.type('this_a_test_message_from_visitor');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.sidenav.openChat(newVisitor.name);
		});

		await test.step('Expect to be able to see contact information and edit', async () => {
			await agent.poHomeChannel.content.btnContactInformation.click();
			await agent.poHomeChannel.content.btnContactEdit.click();
		});

		await test.step('Expect to update room name and subscription when updating contact name', async () => {
			await agent.poContacts.newContact.inputName.fill('Edited Contact Name');
			await agent.poContacts.newContact.btnSave.click();
			await expect(agent.poHomeChannel.sidenav.sidebarChannelsList.getByText('Edited Contact Name')).toBeVisible();
			await expect(agent.poHomeChannel.content.channelHeader.getByText('Edited Contact Name')).toBeVisible();
		});
	});
});
