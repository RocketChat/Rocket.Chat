import type { Page } from '@playwright/test';

import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

declare const window: Window & {
	RocketChat: {
		livechat: {
			setTheme: (theme: { guestBubbleBackgroundColor?: string; agentBubbleBackgroundColor?: string }) => void;
		};
	};
};

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Bubble background color', async () => {
	let agent: Awaited<ReturnType<typeof createAgent>>;
	let poLiveChat: OmnichannelLiveChatEmbedded;
	let poAuxContext: { page: Page; poHomeOmnichannel: HomeOmnichannel };

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');

		const res = await makeAgentAvailable(api, agent.data._id);

		if (res.status() !== 200) {
			throw new Error('Failed to make agent available');
		}
	});

	test.beforeEach(async ({ browser }) => {
		const { page: pageCtx } = await createAuxContext(browser, Users.user1);
		poAuxContext = { page: pageCtx, poHomeOmnichannel: new HomeOmnichannel(pageCtx) };
	});

	test.beforeEach(async ({ page }) => {
		poLiveChat = new OmnichannelLiveChatEmbedded(page);

		await page.goto('/packages/rocketchat_livechat/assets/demo.html');
	});

	test.afterEach(async ({ page }) => {
		await poAuxContext.page?.close();
		await page.close();
	});

	test.afterAll(async () => {
		await agent.delete();
	});

	test('OC - Livechat - Change bubble background color', async () => {
		const visitor = createFakeVisitor();

		await test.step('should initiate Livechat conversation', async () => {
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.fill('message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.txtChatMessage('message_from_user')).toBeVisible();
		});

		await test.step('expect to send a message as agent', async () => {
			await poAuxContext.poHomeOmnichannel.sidenav.openChat(visitor.name);
			await poAuxContext.poHomeOmnichannel.content.sendMessage('message_from_agent');
		});

		await test.step('expect to have default bubble background color', async () => {
			expect(await poLiveChat.messageBubbleBackground('message_from_user')).toBe('rgb(193, 39, 45)');
			expect(await poLiveChat.messageBubbleBackground('message_from_agent')).toBe('rgb(247, 248, 250)');
		});

		await test.step('expect to change bubble background color', async () => {
			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.setTheme({
					guestBubbleBackgroundColor: 'rgb(186, 218, 85)',
					agentBubbleBackgroundColor: 'rgb(0, 100, 250)',
				}),
			);

			expect(await poLiveChat.messageBubbleBackground('message_from_user')).toBe('rgb(186, 218, 85)');
			expect(await poLiveChat.messageBubbleBackground('message_from_agent')).toBe('rgb(0, 100, 250)');
		});

		await test.step('expect to reset bubble background color to defaults', async () => {
			await poLiveChat.page.evaluate(() =>
				window.RocketChat.livechat.setTheme({ guestBubbleBackgroundColor: undefined, agentBubbleBackgroundColor: undefined }),
			);

			expect(await poLiveChat.messageBubbleBackground('message_from_user')).toBe('rgb(193, 39, 45)');
			expect(await poLiveChat.messageBubbleBackground('message_from_agent')).toBe('rgb(247, 248, 250)');
		});

		await test.step('should close the conversation', async () => {
			await poAuxContext.poHomeOmnichannel.sidenav.openChat(visitor.name);
			await poAuxContext.poHomeOmnichannel.content.btnCloseChat.click();
			await poAuxContext.poHomeOmnichannel.content.closeChatModal.inputComment.fill('this_is_a_test_comment');
			await poAuxContext.poHomeOmnichannel.content.closeChatModal.btnConfirm.click();
			await expect(poAuxContext.poHomeOmnichannel.toastSuccess).toBeVisible();
		});
	});
});
