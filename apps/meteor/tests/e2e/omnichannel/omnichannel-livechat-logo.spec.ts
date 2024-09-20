import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { OmnichannelLiveChat, OmnichannelSettings } from '../page-objects';
import { test, expect } from '../utils/test';

test.skip(!IS_EE, 'Enterprise Only');

test.use({ storageState: Users.admin.state });

test.describe('OC - Livechat - Widget logo', async () => {
	let poLiveChat: OmnichannelLiveChat;
	let poOmnichannelSettings: OmnichannelSettings;

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
		const res = await api.post('/assets.unsetAsset', { assetName: 'livechat_widget_logo' });
		if (res.status() !== 200) {
			throw new Error('Failed to unset asset');
		}
	});

	test('OC - Livechat - Change widget logo', async () => {
		await test.step('expect to have default logo', async () => {
			await poOmnichannelSettings.group('Livechat').click();
			await expect(poLiveChat.imgLogo).not.toBeVisible();
			await expect(poOmnichannelSettings.imgLivechatLogoPreview).not.toBeVisible();
		});

		await test.step('expect to change widget logo', async () => {
			await expect(poOmnichannelSettings.labelLivechatLogo).toHaveText('Livechat widget logo (svg, png, jpg)');
			await poOmnichannelSettings.inputLivechatLogo.setInputFiles('./tests/e2e/fixtures/files/test-image.jpeg');
			await expect(poOmnichannelSettings.imgLivechatLogoPreview).toBeVisible();

			await poLiveChat.page.reload();
			await expect(poLiveChat.imgLogo).toBeVisible();
			await expect(poLiveChat.imgLogo).toHaveAttribute('src', 'assets/livechat_widget_logo.jpeg');
		});

		await test.step('expect to remove custom logo', async () => {
			await poOmnichannelSettings.btnDeleteLivechatLogo.click();
			await expect(poOmnichannelSettings.imgLivechatLogoPreview).not.toBeVisible();

			await poLiveChat.page.reload();
			await expect(poLiveChat.imgLogo).not.toBeVisible();
		});
	});
});
