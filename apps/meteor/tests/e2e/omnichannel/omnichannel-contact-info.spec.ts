import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { deleteAgent } from '../utils/omnichannel/agents';
import { deleteManager } from '../utils/omnichannel/managers';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test } from '../utils/test';

test.describe('OC - Contact Info', () => {
	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };

	let agent: { page: Page; poHomeChannel: HomeChannel };

	test.beforeAll(async ({ api, browser }) => {
		// Set user user 1 as manager and agent
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });

		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeChannel: new HomeChannel(page) };
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([deleteClosedRooms(api), deleteAgent(api, 'user1'), deleteManager(api, 'user1')]);

		await agent.page.close();
	});

	test.beforeEach(async ({ api, page }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);

		await page.goto('/livechat');

		visitor = createFakeVisitor();
		await poLiveChat.startChat({ visitor });
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
	});

	test('OC - Contact Info - Receive message from visitor', async () => {
		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeChannel.sidenav.openChat(visitor.name);
		});

		await test.step('expect to be see contact information and edit', async () => {
			await agent.poHomeChannel.content.btnContactInformation.click();
			await agent.poHomeChannel.content.btnContactEdit.click();
		});
	});
});
