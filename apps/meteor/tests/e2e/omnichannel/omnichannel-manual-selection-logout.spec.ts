import type { Page } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS } from '../config/constants';
import injectInitialData from '../fixtures/inject-initial-data';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Manual Selection After Relogin', () => {
	let poOmnichannel: HomeOmnichannel;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	// Change routing method to manual selection
	test.beforeAll(async ({ api }) => {
		const res = await api.post('/settings/Livechat_Routing_Method', { value: 'Manual_Selection' });
		expect(res.status()).toBe(200);
	});

	// Create agent and make it available
	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');
		await makeAgentAvailable(api, agent.data._id);
	});

	// Create page object and redirect to home
	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannel = new HomeOmnichannel(page);
		await page.goto('/home');

		await poOmnichannel.sidenav.logout();
		await poOmnichannel.page.locator('role=textbox[name=/username/i]').waitFor({ state: 'visible' });
		await poOmnichannel.page.locator('role=textbox[name=/username/i]').fill('user1');
		await poOmnichannel.page.locator('[name=password]').fill(DEFAULT_USER_CREDENTIALS.password);
		await poOmnichannel.page.locator('role=button[name="Login"]').click();

		await poOmnichannel.page.locator('.main-content').waitFor();
	});

	// Delete all data
	test.afterAll(async ({ api }) => {
		await agent.delete();
		await api.post('/settings/Livechat_Routing_Method', { value: 'Auto_Selection' });
		await injectInitialData();
	});

	test('OC - Manual Selection - Logout & Login', async ({ api }) => {
		expect(await poOmnichannel.page.locator('#omnichannel-status-toggle').getAttribute('title')).toEqual('Turn off answer chats');

		const {
			data: { room },
		} = await createConversation(api);

		await test.step('expect login and see the chat in queue after login', async () => {
			await poOmnichannel.sidenav.getSidebarItemByName(room.fname).click();
			await expect(poOmnichannel.content.inputMessage).not.toBeVisible();
		});

		await test.step('expect take chat to be visible and return to queue not visible', async () => {
			await expect(poOmnichannel.content.btnTakeChat).toBeVisible();
			await expect(poOmnichannel.content.btnReturnToQueue).not.toBeVisible();
		});

		await test.step('expect to be able take chat', async () => {
			await poOmnichannel.content.btnTakeChat.click();
			await expect(poOmnichannel.content.lastSystemMessageBody).toHaveText('joined the channel');
			await expect(poOmnichannel.content.inputMessage).toBeVisible();
			await expect(poOmnichannel.content.btnTakeChat).not.toBeVisible();
			await expect(poOmnichannel.content.btnReturnToQueue).toBeVisible();
			await expect(poOmnichannel.sidenav.getSidebarItemByName(room.fname)).toBeVisible();
		});
	});
});
