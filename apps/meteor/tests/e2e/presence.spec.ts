import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Registration } from './page-objects';
import { test, expect } from './utils/test';

test.describe.serial('Presence', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test.describe('Login using default settings', () => {
		test('expect user to be online after log in', async ({ page }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.getByRole('button', { name: 'User menu' }).locator('.rcx-status-bullet--online')).toBeVisible();
		});
	});
});
