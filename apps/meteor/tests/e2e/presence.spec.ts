import { DEFAULT_USER_CREDENTIALS, IS_EE } from './config/constants';
import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

test.describe.serial('Presence', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test.beforeAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', true)).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', true)).status()).toBe(200);
	});

	test.describe('Login using default settings', () => {
		test('expect user to be online after log in', async ({ page }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
		});
	});

	test.describe('Login using with "Methods by REST" disabled', () => {
		test.skip(IS_EE, `Micro services don't support turning this setting off`);

		test.beforeAll(async ({ api }) => {
			await expect((await setSettingValueById(api, 'API_Use_REST_For_DDP_Calls', false)).status()).toBe(200);
		});

		test('expect user to be online after log in', async ({ page }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
		});
	});
});
