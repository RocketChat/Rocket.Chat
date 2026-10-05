import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createConversation } from '../utils/omnichannel/rooms';
import { expect, test } from '../utils/test';

test.describe('Omnichannel contact info', () => {
	let conversation: Awaited<ReturnType<typeof createConversation>>;

	let agent: { page: Page; poHomeChannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeOmnichannel(page) };

		conversation = await createConversation(api, { agentId: 'user1' });
	});

	test.afterAll(async ({ api }) => {
		await conversation?.delete();
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
	});

	test('Receiving a message from visitor, and seeing its information', async () => {
		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.goto();
			await agent.poHomeChannel.navbar.openChat(conversation.data.visitor.name);
		});

		await test.step('Expect to be able to see contact information and edit', async () => {
			await agent.poHomeChannel.roomToolbar.openContactInfo();
			await agent.poHomeChannel.contacts.contactInfo.btnEdit.click();
		});

		await test.step('Expect to update room name and subscription when updating contact name', async () => {
			await agent.poHomeChannel.contacts.editContact.inputName.fill('Edited Contact Name');
			await agent.poHomeChannel.contacts.editContact.btnSave.click();
			await expect(agent.poHomeChannel.sidebar.channelsList.getByText('Edited Contact Name')).toBeVisible();
			await expect(agent.poHomeChannel.content.channelHeader.getByText('Edited Contact Name')).toBeVisible();
		});
	});
});
