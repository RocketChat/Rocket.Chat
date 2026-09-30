import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createConversation } from '../utils/omnichannel/rooms';
import { test } from '../utils/test';

test.describe('Omnichannel close chat', () => {
	let conversation: Awaited<ReturnType<typeof createConversation>>;

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
		await conversation?.delete();
	});

	test('Receiving a message from visitor', async ({ api }) => {
		conversation = await createConversation(api, { agentId: 'user1' });

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.goto();
			await agent.poHomeOmnichannel.navbar.openChat(conversation.data.visitor.name);
		});

		await test.step('Expect to be able to close an omnichannel to conversation', async () => {
			await agent.poHomeOmnichannel.quickActionsRoomToolbar.closeChat();
		});
	});
});
