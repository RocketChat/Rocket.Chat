import { faker } from '@faker-js/faker/locale/af_ZA';

import { Users } from '../fixtures/userStates';
import { OmnichannelChats } from '../page-objects/omnichannel-contact-center-chats';
import { setSettingValueById } from '../utils';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { createConversation } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe('OC - Contact Center - Chats', () => {
	let conversations: Awaited<ReturnType<typeof createConversation>>[];
	let agent: Awaited<ReturnType<typeof createAgent>>;

	let poOmniChats: OmnichannelChats;

	const uuid = faker.string.uuid();
	const visitorA = `visitorA_${uuid}`;
	const visitorB = `visitorB_${uuid}`;

	test.beforeAll(async ({ api }) => {
		expect((await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection')).status()).toBe(200);
	});

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');

		expect((await makeAgentAvailable(api, agent.data._id)).status()).toBe(200);
	});

	test.beforeAll(async ({ api }) => {
		conversations = await Promise.all([
			createConversation(api, { agentId: `user1`, visitorName: visitorA }),
			createConversation(api, { agentId: `user1`, visitorName: visitorB }),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poOmniChats = new OmnichannelChats(page);

		await page.goto('/omnichannel-directory/chats');
	});

	test.afterEach(async ({ page }) => {
		await page.close();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([...conversations.map((conversation) => conversation.delete()), agent.delete()]);
		expect((await setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection')).status()).toBe(200);
	});

	test(`OC - Contact Center - Chats - Filter from and to same date`, async ({ page }) => {
		await test.step('expect conversations to be visible', async () => {
			await poOmniChats.inputSearch.fill(uuid);
			await expect(poOmniChats.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.findRowByName(visitorB)).toBeVisible();
		});

		await test.step('expect to filter [from] and [to] today', async () => {
			const [chatA] = conversations.map((c) => c.data);
			const [todayString] = new Date(chatA.room.ts).toISOString().split('T');
			await poOmniChats.btnFilters.click();
			await expect(page).toHaveURL('/omnichannel-directory/chats/filters');
			await poOmniChats.filters.inputFrom.fill(todayString);
			await poOmniChats.filters.inputTo.fill(todayString);
			await poOmniChats.filters.btnApply.click();
			await page.waitForResponse('**/api/v1/livechat/rooms*');
		});

		await test.step('expect conversations to be visible', async () => {
			await expect(poOmniChats.findRowByName(visitorA)).toBeVisible();
			await expect(poOmniChats.findRowByName(visitorB)).toBeVisible();
		});
	});
});
