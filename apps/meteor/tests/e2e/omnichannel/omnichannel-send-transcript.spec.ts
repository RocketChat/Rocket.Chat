import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, HomeChannel } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { createManager } from '../utils/omnichannel/managers';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

test.describe('omnichannel-transcript', () => {
	let poLiveChat: OmnichannelLiveChat;
	let visitor: { email: string; name: string };
	let poAgent: { page: Page; poHomeChannel: HomeChannel };
	let agent: Awaited<ReturnType<typeof createAgent>>;
	let manager: Awaited<ReturnType<typeof createManager>>;

	test.beforeAll(async ({ api, browser }) => {
		visitor = createFakeVisitor();

		// Set user user 1 as manager and agent
		agent = await createAgent(api, 'user1');
		manager = await createManager(api, 'user1');

		const { page } = await createAuxContext(browser, Users.user1);
		poAgent = { page, poHomeChannel: new HomeChannel(page) };
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChat(page, api);

		await page.goto('/livechat');
		await poLiveChat.startChat({ visitor });
	});

	test.afterEach(async () => {
		await poLiveChat.closeChat();
	});

	test.afterAll(async ({ api }) => {
		await deleteClosedRooms(api);
		await agent.delete();
		await manager.delete();
		await poAgent.page.close();
	});

	test('Receiving a message from visitor', async () => {
		await test.step('expect to have 1 omnichannel assigned to agent 1', async () => {
			await poAgent.poHomeChannel.sidenav.openChat(visitor.name);
		});

		await test.step('expect to be able to send transcript to email', async () => {
			await poAgent.poHomeChannel.content.btnSendTranscript.click();
			await poAgent.poHomeChannel.content.btnSendTranscriptToEmail.click();
			await poAgent.poHomeChannel.content.btnModalConfirm.click();
			await expect(poAgent.poHomeChannel.toastSuccess).toBeVisible();
		});

		await test.step('expect to be not able send transcript as PDF', async () => {
			test.skip(!IS_EE, 'Enterprise Only');
			await poAgent.poHomeChannel.content.btnSendTranscript.click();
			await poAgent.poHomeChannel.content.btnSendTranscriptAsPDF.hover();
			await expect(poAgent.poHomeChannel.content.btnSendTranscriptAsPDF).toHaveAttribute('aria-disabled', 'true');
		});
	});
});
