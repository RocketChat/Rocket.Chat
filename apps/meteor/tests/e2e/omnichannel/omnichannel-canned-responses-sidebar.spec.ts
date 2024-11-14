import { type Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { createManager, deleteManager } from '../utils/omnichannel/managers';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test } from '../utils/test';

test.describe('OC - Canned Responses Sidebar', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		visitor = createFakeVisitor();
		// Set user user 1 as manager and agent
		await createAgent(api, 'user1');
		await createManager(api, 'user1');

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeChannel(page) };
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		await agent.page.close();
		await Promise.all([deleteClosedRooms(api), deleteAgent(api, 'user1'), deleteManager(api, 'user1')]);
	});

	test('OC - Canned Responses Sidebar - Receiving a message from visitor', async ({ page }) => {
		await test.step('Expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.startChat({ visitor });
		});

		await test.step('Expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.sidenav.openChat(visitor.name);
		});

		await test.step('Expect to be able to open canned responses sidebar and creation', async () => {
			await agent.poHomeChannel.content.btnCannedResponses.click();
			await agent.poHomeChannel.content.btnNewCannedResponse.click();
		});

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});
});
