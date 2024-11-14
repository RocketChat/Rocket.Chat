import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { createManager, deleteManager } from '../utils/omnichannel/managers';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('OC - Chat History', () => {
	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api, browser }) => {
		visitor = createFakeVisitor();

		// Set user user 1 as manager and agent
		await createAgent(api, 'user1');
		await createManager(api, 'user1');
		const { page } = await createAuxContext(browser, Users.user1);
		agent = { page, poHomeOmnichannel: new HomeOmnichannel(page) };
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([deleteClosedRooms(api), deleteAgent(api, 'user1'), deleteManager(api, 'user1')]);
		await agent.page.close();
	});

	test('OC - Chat History - Receiving a message from visitor', async ({ page }) => {
		await test.step('expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.startChat({ visitor });
		});

		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openChat(visitor.name);
		});

		await test.step('expect to be able to close an omnichannel to conversation', async () => {
			await agent.poHomeOmnichannel.content.btnCloseChat.click();
			await agent.poHomeOmnichannel.content.inputModalClosingComment.fill('any_comment');
			await agent.poHomeOmnichannel.content.btnModalConfirm.click();
			await expect(agent.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect send a message as a visitor again to reopen chat', async () => {
			await page.goto('/livechat');
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage('this_a_test_message_from_visitor');
		});

		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.openChat(visitor.name);
		});

		await test.step('expect to be able to see conversation history', async () => {
			await agent.poHomeOmnichannel.btnContactInfo.click();
			await agent.poHomeOmnichannel.contacts.contactInfo.tabHistory.click();
			await expect(agent.poHomeOmnichannel.contacts.contactInfo.historyItem).toBeVisible();

			await agent.poHomeOmnichannel.contacts.contactInfo.historyItem.click();
			await expect(agent.poHomeOmnichannel.contacts.contactInfo.historyMessage).toBeVisible();
		});

		await test.step('expect to close livechat conversation', async () => {
			await poLiveChat.closeChat();
		});
	});
});
