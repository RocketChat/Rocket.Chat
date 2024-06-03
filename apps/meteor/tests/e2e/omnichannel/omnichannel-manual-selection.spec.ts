import { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user3.state });

test.describe('OC - Manual Selection', () => {
	let poOmnichannel: HomeOmnichannel;
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let agentB: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	// Change routing method to manual selection
	test.beforeAll(async ({ api }) => {
		const res = await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' });
		expect(res.status()).toBe(200);
	});

	// Create agent and make it available
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([await createAgent(api, 'user3'), await createAgent(api, 'user1')]);
		(await Promise.all(agents.map(({ data: agent }) => makeAgentAvailable(api, agent._id)))).forEach((res) => {
			expect(res.status()).toBe(200);
		});
	});

	// Create page object and redirect to home
	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannel = new HomeOmnichannel(page);
		await page.goto('/home');
	});

	// Create agent b session
	test.beforeEach(async ({ browser }) => {
		agentB = await createAuxContext(browser, Users.user1).then(({ page }) => ({ page, poHomeOmnichannel: new HomeOmnichannel(page) }));
	});

	// Delete all data
	test.afterAll(async ({ api }) => {
		await Promise.all([
			agentB.page.close(),
			...agents.map(agent => agent.delete()),
			api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' }),
		]);
	});

	test('OC - Manual Selection - Queue', async ({ page, api }) => {
		const { data: { room } } = await createConversation(api);

		await test.step('expect not be able to see queue when livechat is disabled', async () => {
			await poOmnichannel.sidenav.switchOmnichannelStatus('offline');
			await agentB.poHomeOmnichannel.sidenav.switchOmnichannelStatus('offline');
			await expect(poOmnichannel.sidenav.getSidebarItemByName(room.fname)).not.toBeVisible();
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(room.fname)).not.toBeVisible();
			await poOmnichannel.sidenav.switchOmnichannelStatus('online');
			await agentB.poHomeOmnichannel.sidenav.switchOmnichannelStatus('online');
			await expect(poOmnichannel.sidenav.getSidebarItemByName(room.fname)).toBeVisible();
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(room.fname)).toBeVisible();
		});

		await test.step('expect to be able join chat in read mode', async () => {
			await poOmnichannel.sidenav.getSidebarItemByName(room.fname).click();
			await expect(poOmnichannel.content.inputMessage).not.toBeVisible();
			await expect(poOmnichannel.content.btnTakeChat).toBeVisible();
		});

		await test.step('expect to be able take chat', async () => {
			await poOmnichannel.content.btnTakeChat.click();
			await expect(poOmnichannel.content.lastSystemMessageBody).toHaveText('joined the channel');
			await expect(poOmnichannel.content.inputMessage).toBeVisible();
			await expect(poOmnichannel.content.btnTakeChat).not.toBeVisible();
			await expect(poOmnichannel.sidenav.getSidebarItemByName(room.fname)).toBeVisible();
		});

		await test.step('expect chat to leave the queue', async () => {
			await page.waitForTimeout(250);
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(room.fname)).not.toBeVisible();
		});

		await test.step('expect to be able return to queue', async () => {
			await poOmnichannel.content.btnReturnToQueue.click();
			await poOmnichannel.content.btnReturnToQueueConfirm.click();
			await expect(page).toHaveURL('/home');
		});

		await test.step('expect chat to be back in queue', async () => {
			await expect(poOmnichannel.sidenav.getSidebarItemByName(room.fname)).toBeVisible();
			await expect(agentB.poHomeOmnichannel.sidenav.getSidebarItemByName(room.fname)).toBeVisible();

			await poOmnichannel.sidenav.getSidebarItemByName(room.fname).click();
			await expect(poOmnichannel.content.inputMessage).not.toBeVisible();
			await expect(poOmnichannel.content.btnTakeChat).toBeVisible();
		});
	});
});
