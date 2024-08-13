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
		test.beforeAll(async ({ api }) => {
			expect((await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: false })).status()).toBe(200);
		});

		test.afterAll(async ({ api }) => {
			expect((await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: true })).status()).toBe(200);
		});

		test('Login using credentials and reload to stay logged in', async ({ page }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.locator('[data-qa-id="homepage-welcome-text"]')).toBeVisible();

			await page.reload();

			await expect(page.locator('[data-qa-id="homepage-welcome-text"]')).toBeVisible();
		});
	});

	test.describe('Setting on', async () => {
		test.beforeAll(async ({ api }) => {
			expect((await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: true })).status()).toBe(200);
		});

		test.afterAll(async ({ api }) => {
			expect((await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: false })).status()).toBe(200);
		});

		test('Login using credentials and reload to get logged out', async ({ page }) => {
			await poRegistration.username.type('user1');
			await poRegistration.inputPassword.type(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration.btnLogin.click();

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

			await page.reload();

			await expect(page.locator('role=button[name="Login"]')).toBeVisible();
		});
	});
});
