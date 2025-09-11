import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat } from '../page-objects';
import { OmnichannelLivechatAppearance } from '../page-objects/omnichannel-livechat-appearance';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

test.skip(!IS_EE, 'Enterprise Only');

test.use({ storageState: Users.admin.state });

test.describe('OC - Livechat - Hide "Expand chat"', async () => {
	let agent: Awaited<ReturnType<typeof createAgent>>;
	let poLiveChat: OmnichannelLiveChat;
	let poLivechatAppearance: OmnichannelLivechatAppearance;

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');

		const res = await makeAgentAvailable(api, agent.data._id);

		await expect(res.status()).toBe(200);
	});

	test.beforeEach(async ({ browser, api }) => {
		const { page: livechatPage } = await createAuxContext(browser, Users.user1, '/livechat', false);

		poLiveChat = new OmnichannelLiveChat(livechatPage, api);
	});

	test.afterEach(async () => {
		await poLiveChat.page.close();
	});

	test.beforeEach(async ({ page }) => {
		poLivechatAppearance = new OmnichannelLivechatAppearance(page);

		await page.goto('/omnichannel/appearance');
	});

	test.afterAll(async ({ api }) => {
		const res = await api.post('/settings/Livechat_hide_expand_chat', { value: false });
		await expect(res.status()).toBe(200);
	});

	test('OC - Livechat - Hide "Expand chat"', async () => {
		await test.step('expect to open Livechat', async () => {
			await poLiveChat.openLiveChat();
		});

		await test.step('expect "Expand chat" button to start visible (default)', async () => {
			await expect(poLiveChat.btnExpandChat).toBeVisible();
		});

		await test.step('expect to change setting', async () => {
			await poLivechatAppearance.labelHideExpandChat.click();
			await poLivechatAppearance.btnSave.click();
		});

		await test.step('expect "Expand chat" button to be hidden', async () => {
			await poLiveChat.page.reload();
			await poLiveChat.openLiveChat();
			await expect(poLiveChat.btnExpandChat).toBeHidden();
		});
	});
});
