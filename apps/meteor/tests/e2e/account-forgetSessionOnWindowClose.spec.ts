import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { AccountSecurity, HomeChannel, Login } from './page-objects';
import { test, expect } from './utils/test';
import { createTestUser, type ITestUser } from './utils/user-helpers';

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

		test.describe('E2EE save password flow', () => {
			// Dedicated throwaway user: resetE2EEPassword() calls Users.unsetLoginTokens(),
			// which would invalidate the shared admin login token the `api` fixture
			// authenticates with — breaking every subsequent admin-authenticated request
			// in the worker (e.g. the next spec's beforeAll settings changes silently 401).
			let e2eeUser: ITestUser;

			test.beforeAll(async ({ api }) => {
				await api.post('/settings/E2E_Enable', { value: true });
				await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });

				e2eeUser = await createTestUser(api);
			});

			test.afterAll(async ({ api }) => {
				await e2eeUser?.delete();
				await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
				await api.post('/settings/E2E_Enable', { value: false });
			});

			test('E2EE save password button opens modal in SAVE_PASSWORD state', async ({ page }) => {
				const poHomeChannel = new HomeChannel(page);
				const poAccountSecurity = new AccountSecurity(page);

				await poLogin.login(e2eeUser.data.username, DEFAULT_USER_CREDENTIALS.password);
				await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();

				await poAccountSecurity.goto();
				await poAccountSecurity.resetE2EEPassword();

				await page.locator('role=button[name="Login"]').waitFor();

				await poLogin.login(e2eeUser.data.username, DEFAULT_USER_CREDENTIALS.password);
				await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
				await expect(poHomeChannel.bannerSaveEncryptionPassword).toBeVisible();
				await poHomeChannel.bannerSaveEncryptionPassword.click();

				const randomPassword = await page.evaluate(() => window.sessionStorage.getItem('e2e.randomPassword') ?? '');
				expect(randomPassword).toBeTruthy();

				await expect(poHomeChannel.dialogSaveE2EEPassword).toBeVisible();
				await expect(poHomeChannel.dialogSaveE2EEPassword).toContainText(randomPassword);
			});
		});
	});
});
