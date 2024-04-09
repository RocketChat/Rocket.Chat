import { faker } from '@faker-js/faker';
import { Page } from '@playwright/test';

import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChatEmbedded } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

declare const window: Window & {
	RocketChat: {
		livechat: {
			setTheme: (theme: { hideAgentAvatar?: boolean; hideGuestAvatar?: boolean }) => void;
		};
	};
};

const createVisitor = () => ({
	name: `${faker.person.firstName()} ${faker.string.uuid()}`,
	email: faker.internet.email(),
});

test.use({ storageState: Users.user1.state });

test.describe('OC - Livechat - Avatar visibility', async () => {
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

	test('OC - Livechat - Change avatar visibility', async () => {
		const visitor = createVisitor();

		await test.step('should initiate Livechat conversation', async () => {
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(visitor, false);
			await poLiveChat.onlineAgentMessage.fill('this_a_test_message_from_user');
			await poLiveChat.btnSendMessageToOnlineAgent.click();
			await expect(poLiveChat.txtChatMessage('this_a_test_message_from_user')).toBeVisible();
		});

		await test.step('expect to send a message as agent', async () => {
			await poAuxContext.poHomeOmnichannel.sidenav.openChat(visitor.name);
			await poAuxContext.poHomeOmnichannel.content.sendMessage('this_is_a_test_message_from_agent');
			await expect(poLiveChat.txtChatMessage('this_is_a_test_message_from_agent')).toBeVisible();
		});

		await test.step('expect visitor avatar to be hidden', async () => {
			await expect(poLiveChat.imgAvatar(visitor.name)).not.toBeVisible();
		});

		await test.step('expect agent avatar to be visible', async () => {
			await expect(poLiveChat.imgAvatar('user1')).toBeVisible();
		});

		await test.step('expect to make visitor avatar visible', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setTheme({ hideGuestAvatar: false }));
			await expect(poLiveChat.imgAvatar(visitor.name)).toBeVisible();
		});

		await test.step('expect to hide agent avatar', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setTheme({ hideAgentAvatar: false }));
			await expect(poLiveChat.imgAvatar('user1')).toBeVisible();
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
