import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelLivechatAppearance } from '../page-objects/omnichannel-livechat-appearance';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.skip(!IS_EE, 'Enterprise Only');

test.describe.serial('OC - Livechat Appearance', () => {
	let poLivechatAppearance: OmnichannelLivechatAppearance;

	test.beforeEach(async ({ page }) => {
		poLivechatAppearance = new OmnichannelLivechatAppearance(page);

		await page.goto('/omnichannel');
		await poLivechatAppearance.sidenav.linkLivechatAppearance.click();
	});

	test.afterAll(async ({ api }) => {
		const res = await Promise.all([
			api.post('/settings/Livechat_hide_system_messages', { value: ['uj', 'ul', 'livechat-close'] }),
			api.post('/settings/Livechat_background', { value: '' }),
		]);

		if (res.some((r) => r.status() !== 200)) {
			throw new Error('Failed to reset settings');
		}
	});

	test('OC - Livechat Appearance - Hide system messages', async ({ page }) => {
		await test.step('expect to have default values', async () => {
			// Clicking at the edge of the element to prevent playwright from clicking a chip by mistake
			await poLivechatAppearance.inputHideSystemMessages.locator('.rcx-icon--name-chevron-down').click();
			await expect(poLivechatAppearance.findHideSystemMessageOption('uj')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('ul')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('livechat-close')).toHaveAttribute('aria-selected', 'true');
			await poLivechatAppearance.inputHideSystemMessages.locator('.rcx-icon--name-chevron-up').click();
		});

		await test.step('expect to change values', async () => {
			// Clicking at the edge of the element to prevent playwright from clicking a chip by mistake
			await poLivechatAppearance.inputHideSystemMessages.locator('.rcx-icon--name-chevron-down').click();
			await poLivechatAppearance.findHideSystemMessageOption('livechat_transfer_history').click();
			await poLivechatAppearance.findHideSystemMessageOption('livechat-close').click();
			await poLivechatAppearance.btnSave.click();
		});

		await test.step('expect to have saved changes', async () => {
			await page.reload();
			// Clicking at the edge of the element to prevent playwright from clicking a chip by mistake
			await poLivechatAppearance.inputHideSystemMessages.locator('.rcx-icon--name-chevron-down').click();
			await expect(poLivechatAppearance.findHideSystemMessageOption('uj')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('ul')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('livechat_transfer_history')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('livechat-close')).toHaveAttribute('aria-selected', 'false');
		});
	});

	test('OC - Livechat Appearance - Change Livechat background', async ({ page }) => {
		await test.step('expect to have default value', async () => {
			await expect(await poLivechatAppearance.inputLivechatBackground).toHaveValue('');
		});

		await test.step('expect to change value', async () => {
			await poLivechatAppearance.inputLivechatBackground.fill('rgb(186, 1, 85)');
			await poLivechatAppearance.btnSave.click();
		});

		await test.step('expect to have saved changes', async () => {
			await page.reload();
			await expect(poLivechatAppearance.inputLivechatBackground).toHaveValue('rgb(186, 1, 85)');
		});
	});
});
