import type { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { createManager } from '../utils/omnichannel/managers';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('OC - Chat transfers [Agent role]', () => {
	let sessions: { page: Page; poHomeOmnichannel: HomeOmnichannel }[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let managers: Awaited<ReturnType<typeof createManager>>[];
	let conversations: Awaited<ReturnType<typeof createConversation>>[];

	// Create agents and managers
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2')]);

		managers = await Promise.all([createManager(api, 'user1')]);
	});

	// Livechat when agent idle
	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Livechat_enabled_when_agent_idle', { value: false }).then((res) => expect(res.status()).toBe(200));
	});

	// Create agent sessions
	test.beforeAll(async ({ browser }) => {
		sessions = await Promise.all([
			createAuxContext(browser, Users.user1).then(({ page }) => ({ page, poHomeOmnichannel: new HomeOmnichannel(page) })),
			createAuxContext(browser, Users.user2).then(({ page }) => ({ page, poHomeOmnichannel: new HomeOmnichannel(page) })),
		]);
	});

	// Delete all data
	test.afterAll(async ({ api }) => {
		await Promise.all([
			...conversations.map((conversation) => conversation.delete()),
			...agents.map((agent) => agent.delete()),
			...managers.map((manager) => manager.delete()),
			api.post('/settings/Livechat_enabled_when_agent_idle', { value: true }).then((res) => expect(res.status()).toBe(200)),
		]);
	});

	// Make "user-1" online & "user-2" offline so that chat can be automatically routed to "user-1"
	test.beforeAll(async () => {
		const [agentA, agentB] = sessions;
		await agentA.poHomeOmnichannel.sidenav.switchStatus('online');
		await agentB.poHomeOmnichannel.sidenav.switchStatus('offline');
	});

	// Close sessions
	test.afterAll(async () => {
		await Promise.all(sessions.map(({ page }) => page.close()));
	});

	// Start a new chat for each test
	test.beforeAll(async ({ api }) => {
		conversations = [await createConversation(api)];
	});

	test('OC - Chat transfers [Agent role] - Transfer omnichannel chat to another agent', async () => {
		const [agentA, agentB] = sessions;
		const [{ visitor }] = conversations.map(({ data }) => data);

		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(visitor.name).click();
		});

		await test.step('expect to not be able to transfer chat to "user-2" when that user is offline', async () => {
			await agentB.poHomeOmnichannel.sidenav.switchStatus('offline');

			await agentA.poHomeOmnichannel.content.btnForwardChat.click();
			await agentA.poHomeOmnichannel.content.forwardChatModal.inputFowardUser.click();
			await agentA.poHomeOmnichannel.content.forwardChatModal.inputFowardUser.type('user2');
			await expect(agentA.page.locator('text=Empty')).toBeVisible();

			await agentA.page.goto('/');
		});

		await test.step('expect to be able to transfer an omnichannel to conversation to agent 2 as agent 1 when agent 2 is online', async () => {
			await agentB.poHomeOmnichannel.sidenav.switchStatus('online');

			await agentA.poHomeOmnichannel.sidenav.getSidebarItemByName(visitor.name).click();
			await agentA.poHomeOmnichannel.content.btnForwardChat.click();
			await agentA.poHomeOmnichannel.content.forwardChatModal.selectUser('user2');
			await agentA.poHomeOmnichannel.content.forwardChatModal.inputComment.type('any_comment');
			await agentA.poHomeOmnichannel.content.forwardChatModal.btnForward.click();
			await expect(agentA.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect to have 1 omnichannel assigned to agent 2', async () => {
			await agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(visitor.name).click();
		});
	});
});
