import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test } from '../utils/test';

test.describe('OC - Chat Auto-Transfer', () => {
	test.skip(!IS_EE, 'Enterprise Only');

	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };

	let agent1: { page: Page; poHomeChannel: HomeChannel };
	let agent2: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		await Promise.all([
			createAgent(api, 'user1'),
			createAgent(api, 'user2'),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
			setSettingValueById(api, 'Livechat_auto_transfer_chat_timeout', 5),
		]);

		const { page } = await createAuxContext(browser, Users.user1);
		agent1 = { page, poHomeChannel: new HomeChannel(page) };

		const { page: page2 } = await createAuxContext(browser, Users.user2);
		agent2 = { page: page2, poHomeChannel: new HomeChannel(page2) };
	});

	test.afterAll(async ({ api }) => {
		await agent1.page.close();
		await agent2.page.close();

		await Promise.all([
			deleteClosedRooms(api),
			deleteAgent(api, 'user1'),
			deleteAgent(api, 'user2'),
			setSettingValueById(api, 'Livechat_auto_transfer_chat_timeout', 0),
		]);
	});

	test.beforeEach(async ({ page, api }) => {
		// make "user-1" online
		await agent1.poHomeChannel.sidenav.switchOmnichannelStatus('online');
		await agent2.poHomeChannel.sidenav.switchOmnichannelStatus('offline');

		// start a new chat for each test
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.beforeEach(async ({ page }) => {
		visitor = createFakeVisitor();

		await page.goto('/livechat');
		await poLiveChat.startChat({ visitor });
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
	});

	test('OC - Chat Auto-Transfer - Transfer after 5 seconds idle', async () => {
		await test.step('expect chat to be auto transferred to next agent within 5 seconds of no reply from first agent', async () => {
			await agent1.poHomeChannel.sidenav.openChat(visitor.name);

			await agent2.poHomeChannel.sidenav.switchOmnichannelStatus('online');

			// wait for the chat to be closed automatically for 5 seconds
			await agent1.page.waitForTimeout(7000);

			await agent2.poHomeChannel.sidenav.openChat(visitor.name);
		});
	});
});
