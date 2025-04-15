import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Registration } from './page-objects';
import { test, expect } from './utils/test';

test.describe.serial('Forget session on window close setting', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);

		await page.goto('/home');
	});

	test.describe('Setting off', async () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Accounts_ForgetUserSessionOnWindowClose', false, false);
		});

		test('Login using credentials and reload to stay logged in', async ({ page, context }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

			const newPage = await context.newPage();
			await newPage.goto('/home');

			await expect(newPage.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
		});
	});

	// TODO: Fix this test
	test.describe.skip('Setting on', async () => {
		test.beforeAll(async ({ updateSetting }) => {
			await updateSetting('Accounts_ForgetUserSessionOnWindowClose', true);
		});

		test.afterAll(async ({ restoreSettings }) => {
			await restoreSettings();
		});

		test('Login using credentials and reload to get logged out', async ({ page, context }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

			const newPage = await context.newPage();
			await newPage.goto('/home');

			await expect(newPage.locator('role=button[name="Login"]')).toBeVisible();
		});
	});
});
