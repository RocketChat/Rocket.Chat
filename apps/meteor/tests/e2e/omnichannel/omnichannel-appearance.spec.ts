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
		const res = await api.post('/settings/Livechat_hide_system_messages', { value: ['uj', 'ul', 'livechat-close'] });
		await expect(res.status()).toBe(200);
	});

	test('OC - Livechat Appearance - Hide system messages', async ({ page }) => {
		await test.step('expect to have default values', async () => {
			// Clicking at the edge of the element to prevent playwright from clicking a chip by mistake
			await poLivechatAppearance.inputHideSystemMessages.click({ position: { x: 0, y: 0 } });
			await expect(poLivechatAppearance.findHideSystemMessageOption('uj')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('ul')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('livechat-close')).toHaveAttribute('aria-selected', 'true');
			await poLivechatAppearance.inputHideSystemMessages.click({ position: { x: 0, y: 0 } });
		});

		await test.step('expect to change values', async () => {
			// Clicking at the edge of the element to prevent playwright from clicking a chip by mistake
			await poLivechatAppearance.inputHideSystemMessages.click({ position: { x: 0, y: 0 } });
			await poLivechatAppearance.findHideSystemMessageOption('livechat_transfer_history').click();
			await poLivechatAppearance.findHideSystemMessageOption('livechat-close').click();
			await poLivechatAppearance.btnSave.click();
		});

		await test.step('expect to have saved changes', async () => {
			await page.reload();
			// Clicking at the edge of the element to prevent playwright from clicking a chip by mistake
			await poLivechatAppearance.inputHideSystemMessages.click({ position: { x: 0, y: 0 } });
			await expect(poLivechatAppearance.findHideSystemMessageOption('uj')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('ul')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('livechat_transfer_history')).toHaveAttribute('aria-selected', 'true');
			await expect(poLivechatAppearance.findHideSystemMessageOption('livechat-close')).toHaveAttribute('aria-selected', 'false');
		});
	});
});
