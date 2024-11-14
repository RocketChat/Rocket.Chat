import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeOmnichannel } from '../page-objects';
import { setSettingValueById } from '../utils';
import { createAgent, deleteAgent } from '../utils/omnichannel/agents';
import { createManager, deleteManager } from '../utils/omnichannel/managers';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('OC - Close Inquiry', () => {
	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };

	let agent: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api }) => {
		visitor = createFakeVisitor();

		await setSettingValueById(api, 'Livechat_Routing_Method', 'Manual_Selection');
		await createAgent(api, 'user1');
		await createManager(api, 'user1');
	});

	test.beforeEach(async ({ page, api, browser }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);

		const { page: auxPage } = await createAuxContext(browser, Users.user1);
		agent = { page: auxPage, poHomeOmnichannel: new HomeOmnichannel(auxPage) };
	});

	test.afterEach(async () => {
		await agent.page.close();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteClosedRooms(api),
			deleteAgent(api, 'user1'),
			deleteManager(api, 'user1'),
			setSettingValueById(api, 'Livechat_Routing_Method', 'Auto_Selection'),
		]);
	});

	test('OC - Close Inquiry - Receiving a message from visitor', async ({ page }) => {
		await test.step('expect send a message as a visitor', async () => {
			await page.goto('/livechat');
			await poLiveChat.startChat({ visitor });
		});

		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await agent.poHomeOmnichannel.sidenav.getQueuedChat(visitor.name).click();
			await expect(agent.poHomeOmnichannel.content.btnTakeChat).toBeVisible();
		});

		await test.step('expect to be able to close an inquiry conversation', async () => {
			await agent.poHomeOmnichannel.content.closeChat();
			await expect(agent.poHomeOmnichannel.toastSuccess).toBeVisible();
		});

		await test.step('expect to inquiry be closed when navigate back', async () => {
			await agent.poHomeOmnichannel.sidenav.openAdministrationByLabel('Omnichannel');
			await agent.poHomeOmnichannel.omnisidenav.linkCurrentChats.click();
			await agent.poHomeOmnichannel.currentChats.findRowByName(visitor.name).click();
			await expect(agent.poHomeOmnichannel.content.btnTakeChat).not.toBeVisible();
		});
	});
});
