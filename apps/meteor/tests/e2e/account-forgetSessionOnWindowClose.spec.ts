import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Login } from './page-objects';
import { test, expect } from './utils/test';

test.describe.serial('Forget session on window close setting', () => {
	let poLogin: Login;

	test.beforeEach(async ({ page }) => {
		poLogin = new Login(page);

		await page.goto('/home');
	});

	test.describe('Setting off', async () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: false });
		});

		test('Login using credentials and reload to stay logged in', async ({ page, context }) => {
			await poLogin.login('user1', DEFAULT_USER_CREDENTIALS.password);

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

			const newPage = await context.newPage();
			await newPage.goto('/home');

			await expect(newPage.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
		});
	});

	test.describe('Setting on', async () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: true });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: false });
		});

		test('Login using credentials and reload to stay logged in', async ({ page }) => {
			await poLogin.login('user1', DEFAULT_USER_CREDENTIALS.password);

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

			await page.reload();

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
		});

		test('Login using credentials in a new tab after first tab logged in', async ({ page, context }) => {
			await poLogin.login('user1', DEFAULT_USER_CREDENTIALS.password);

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

			const newPage = await context.newPage();
			await newPage.goto('/home');

			const newPoLogin = new Login(newPage);
			await newPoLogin.login('user1', DEFAULT_USER_CREDENTIALS.password);

			await expect(newPage.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
		});
	});
});
