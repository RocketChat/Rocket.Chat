import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChatEmbedded } from '../page-objects';
import { createAgent, makeAgentAvailable } from '../utils/omnichannel/agents';
import { deleteClosedRooms } from '../utils/omnichannel/rooms';
import { test, expect } from '../utils/test';

declare const window: Window & {
	RocketChat: {
		livechat: {
			setTheme: (theme: { background?: string }) => void;
		};
	};
};

test.use({ storageState: Users.admin.state });

test.skip(!IS_EE, 'Enterprise Only');

test.describe('OC - Livechat - Message list background', async () => {
	let agent: Awaited<ReturnType<typeof createAgent>>;
	let poLiveChat: OmnichannelLiveChatEmbedded;

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user1');

		const res = await makeAgentAvailable(api, agent.data._id);

		if (res.status() !== 200) {
			throw new Error('Failed to make agent available');
		}
	});

	test.beforeEach(async ({ page, api }) => {
		poLiveChat = new OmnichannelLiveChatEmbedded(page, api);

		await page.goto('/packages/rocketchat_livechat/assets/demo.html');
	});

	test.beforeEach(async () => {
		await poLiveChat.startChat({ message: 'message_from_user' });
	});

	test.afterEach(async ({ page }) => {
		await poLiveChat.closeChat();
		await page.close();
	});

	test.afterAll(async ({ api }) => {
		await deleteClosedRooms(api);
		await agent.delete();
	});

	test('OC - Livechat - Change message list background', async ({ api, page }) => {
		await test.step('expect message list to have default background', async () => {
			await expect(await poLiveChat.messageListBackground).toBe('rgba(0, 0, 0, 0)');
		});

		await test.step('expect to change message list background', async () => {
			const res = await api.post('/settings/Livechat_background', { value: 'rgb(186, 1, 85)' });
			await expect(res.status()).toBe(200);

			await page.reload();
			await poLiveChat.openLiveChat();
			await expect(await poLiveChat.messageListBackground).toBe('rgb(186, 1, 85)');
		});

		await test.step('expect to give priority to background provided via api', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setTheme({ background: 'rgb(186, 218, 85)' }));

			await expect(await poLiveChat.messageListBackground).toBe('rgb(186, 218, 85)');
		});

		await test.step('expect to fallback to setting if api background is not available', async () => {
			await poLiveChat.page.evaluate(() => window.RocketChat.livechat.setTheme({ background: undefined }));
			await expect(await poLiveChat.messageListBackground).toBe('rgb(186, 1, 85)');
		});

		await test.step('expect to reset message list background to default', async () => {
			const res = await api.post('/settings/Livechat_background', { value: '' });
			await expect(res.status()).toBe(200);

			await page.reload();
			await poLiveChat.openLiveChat();
			await expect(await poLiveChat.messageListBackground).toBe('rgba(0, 0, 0, 0)');
		});
	});
});
