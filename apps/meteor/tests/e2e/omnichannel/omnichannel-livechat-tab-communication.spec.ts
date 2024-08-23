import { createFakeVisitor } from '../../mocks/data';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel, OmnichannelLiveChat } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

test.describe('OC - Livechat - Cross Tab Communication', () => {
	let pageLivechat1: OmnichannelLiveChat;
	let pageLivechat2: OmnichannelLiveChat;

	let poHomeOmnichannel: HomeOmnichannel;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ browser, api }) => {
		agent = await createAgent(api, 'user1');

		const { page } = await createAuxContext(browser, Users.user1, '/');
		poHomeOmnichannel = new HomeOmnichannel(page);
	});

	test.beforeEach(async ({ browser, api }) => {
		const context = await browser.newContext();
		const p1 = await context.newPage();
		const p2 = await context.newPage();

		pageLivechat1 = new OmnichannelLiveChat(p1, api);
		pageLivechat2 = new OmnichannelLiveChat(p2, api);

		await pageLivechat1.page.goto('/livechat');
		await pageLivechat2.page.goto('/livechat');
	});

	test.afterEach(async () => {
		await pageLivechat1.page.close();
		await pageLivechat2.page.close();
	});

	test.afterAll(async () => {
		await poHomeOmnichannel.page.close();
		await agent.delete();
	});

	test('OC - Livechat - Send messages, close chat and start again 2 tabs', async () => {
		const visitor = createFakeVisitor();

		await test.step('expect livechat conversations to be synced', async () => {
			await pageLivechat1.openAnyLiveChat();

			await pageLivechat1.sendMessage(visitor, false);
			await pageLivechat1.onlineAgentMessage.fill('this_a_test_message_from_user');
			await pageLivechat1.btnSendMessageToOnlineAgent.click();

			await expect(pageLivechat1.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();

			await expect(pageLivechat2.page.locator('div >> text="this_a_test_message_from_user"')).toBeVisible();
		});

		await test.step('expect to restart a livechat conversation and tabs to be synced', async () => {
			await expect(pageLivechat1.btnOptions).toBeVisible();
			await pageLivechat1.btnOptions.click();

			await expect(pageLivechat1.btnCloseChat).toBeVisible();
			await pageLivechat1.btnCloseChat.click();

			await pageLivechat1.btnCloseChatConfirm.click();

			await expect(pageLivechat1.btnNewChat).toBeVisible();
			await pageLivechat1.startNewChat();

			await pageLivechat1.onlineAgentMessage.fill('this_a_test_message_from_user_after_close');
			await pageLivechat1.btnSendMessageToOnlineAgent.click();

			await pageLivechat1.page.locator('div >> text="this_a_test_message_from_user"').waitFor({ state: 'hidden' });
			await pageLivechat2.page.locator('div >> text="this_a_test_message_from_user"').waitFor({ state: 'hidden' });

			await expect(pageLivechat1.page.locator('div >> text="this_a_test_message_from_user"')).not.toBeVisible();
			await expect(pageLivechat2.page.locator('div >> text="this_a_test_message_from_user"')).not.toBeVisible();

			await expect(pageLivechat1.page.locator('div >> text="this_a_test_message_from_user_after_close"')).toBeVisible();
			await expect(pageLivechat2.page.locator('div >> text="this_a_test_message_from_user_after_close"')).toBeVisible();
		});
	});
});
