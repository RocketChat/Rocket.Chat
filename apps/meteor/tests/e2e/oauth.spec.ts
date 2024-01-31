import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe('OAuth', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
	});

	test('Login Page', async ({ page, api }) => {
		await test.step('expect OAuth button to be visible', async () => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', true)).status()).toBe(200);
			await page.waitForTimeout(5000);

			await page.goto('/home');

			await expect(poRegistration.btnLoginWithGoogle).toBeVisible();
		});

		await test.step('expect OAuth button to not be visible', async () => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', false)).status()).toBe(200);
			await page.waitForTimeout(5000);

			await page.goto('/home');
			await expect(poRegistration.btnLoginWithGoogle).not.toBeVisible();
		});
	});
});
