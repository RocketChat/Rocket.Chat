import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, OmnichannelSettings } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { test, expect } from '../utils/test';

const visitor = createFakeVisitor();

test.skip(!IS_EE, 'Enterprise Only');

test.use({ storageState: Users.admin.state });

test.describe('OC - Livechat - Hide watermark', async () => {
	let agent: Awaited<ReturnType<typeof createAgent>>;
	let poLiveChat: OmnichannelLiveChat;
	let poOmnichannelSettings: OmnichannelSettings;

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
		poOmnichannelSettings = new OmnichannelSettings(page);

		await page.goto('/admin/settings/Omnichannel');
	});

	test.afterAll(async ({ api }) => {
		const res = await api.post('/settings/Livechat_hide_watermark', { value: false });
		await expect(res.status()).toBe(200);
	});

	test('OC - Livechat - Hide watermark', async () => {
		await test.step('expect to open Livechat', async () => {
			await poLiveChat.openLiveChat();
			await poLiveChat.sendMessage(visitor, false);
		});

		await test.step('expect watermark to start visible (default)', async () => {
			await expect(poLiveChat.onlineAgentMessage).toBeVisible();
			await expect(poLiveChat.txtWatermark).toBeVisible();
		});

		await test.step('expect to change setting', async () => {
			await poOmnichannelSettings.group('Livechat').click();
			await poOmnichannelSettings.labelHideWatermark.click();
			await poOmnichannelSettings.btnSave.click();
		});

		await test.step('expect watermark to be hidden', async () => {
			await poLiveChat.page.reload();
			await poLiveChat.openLiveChat();
			await expect(poLiveChat.onlineAgentMessage).toBeVisible();
			await expect(poLiveChat.txtWatermark).toBeHidden();
		});
	});
});
