import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { createConversation } from '../utils/omnichannel/rooms';
import { expect, test } from '../utils/test';

test.describe('OC - Contact Unknown Callout', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let conversation: Awaited<ReturnType<typeof createConversation>>;

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeChannel(page) };
	});
	test.beforeEach('create livechat conversation', async ({ api }) => {
		conversation = await createConversation(api, { agentId: 'user1' });
	});

	test.afterEach('close livechat conversation', async () => {
		await conversation.delete();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
		await agent.page.close();
	});

	test('OC - Contact Unknown Callout - Dismiss callout', async () => {
		await test.step('expect to open conversation', async () => {
			await agent.poHomeChannel.goto();
			await agent.poHomeChannel.navbar.openChat(conversation.data.visitor.name);
		});

		await test.step('expect contact unknown callout to be visible', async () => {
			await expect(agent.poHomeChannel.content.contactUnknownCallout).toBeVisible();
		});

		await test.step('expect to hide callout when dismiss is clicked', async () => {
			await agent.poHomeChannel.content.btnDismissContactUnknownCallout.click();
			await expect(agent.poHomeChannel.content.contactUnknownCallout).not.toBeVisible();
		});

		await test.step('expect keep callout hidden after changing pages', async () => {
			await agent.poHomeChannel.navbar.btnHome.click();
			await agent.poHomeChannel.navbar.openChat(conversation.data.visitor.name);
			await expect(agent.poHomeChannel.content.contactUnknownCallout).not.toBeVisible();
		});
	});
});
