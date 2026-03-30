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

	// TODO: Fix this test
	test.describe.skip('Setting on', async () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: true });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/settings/Accounts_ForgetUserSessionOnWindowClose', { value: false });
		});

		test('Login using credentials and reload to get logged out', async ({ page, context }) => {
			await poLogin.login('user1', DEFAULT_USER_CREDENTIALS.password);

			await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

			const newPage = await context.newPage();
			await newPage.goto('/home');

			await expect(newPage.locator('role=button[name="Login"]')).toBeVisible();
		});
	});
});
