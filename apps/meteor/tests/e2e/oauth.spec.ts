import { BASE_URL } from './config/constants';
import { Registration } from './page-objects';
import { setSettingValueById } from './utils/setSettingValueById';
import { test, expect } from './utils/test';

const waitForServiceSettingsUpdate = () => new Promise((resolve) => setTimeout(resolve, 5000));

test.describe('OAuth', () => {
	let poRegistration: Registration;

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
	});

	test.describe('Login Page', () => {
		test.afterEach(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_OAuth_Google', false);
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false);
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect');
		});

		test('Login Page', async ({ page, api }) => {
			await test.step('expect OAuth button to be visible', async () => {
				await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', true)).status()).toBe(200);
				await page.waitForTimeout(5000);

				await page.goto('/home');

				await expect(poRegistration.btnLoginWithGoogle).toBeVisible();
			});

			await test.step('expect Custom OAuth button to be visible', async () => {
				await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);
				await page.waitForTimeout(5000);
				await page.goto('/home');

				await expect(poRegistration.btnLoginWithCustomOAuth).toBeVisible();
			});

			await test.step('expect redirect to the configured URL.', async () => {
				await poRegistration.btnLoginWithCustomOAuth.click();
				await expect(page).toHaveURL(/https:\/\/(www)?\.rocket\.chat/);
			});

			await test.step('expect OAuth button to not be visible', async () => {
				await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', false)).status()).toBe(200);
				await page.waitForTimeout(5000);

				await page.goto('/home');
				await expect(poRegistration.btnLoginWithGoogle).not.toBeVisible();
			});

			await test.step('expect Custom OAuth button to not be visible', async () => {
				await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false)).status()).toBe(200);
				await page.waitForTimeout(5000);

				await page.goto('/home');
				await expect(poRegistration.btnLoginWithCustomOAuth).not.toBeVisible();
			});
		});
	});

	test.describe('Pop-up login style', () => {
		test.beforeAll(async ({ api }) => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'popup')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);
			await waitForServiceSettingsUpdate();
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false);
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect');
		});

		test('open authorize flow in a popup', async ({ page }) => {
			await test.step('expect Custom OAuth button to be visible', async () => {
				await page.goto('/home');
				await expect(poRegistration.btnLoginWithCustomOAuth).toBeVisible();
			});

			await test.step('expect authorize flow to be opened in a popup', async () => {
				const [popup] = await Promise.all([page.waitForEvent('popup'), poRegistration.btnLoginWithCustomOAuth.click()]);

				await expect(popup).toHaveURL(/https:\/\/(www\.)?rocket\.chat\/oauth\/authorize/);
				await expect(page).toHaveURL(/\/home/);
				await popup.close();
			});
		});
	});

	test.describe('Proxy Redirect', () => {
		test.beforeAll(async ({ api }) => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Proxy_services', 'test')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);
			await waitForServiceSettingsUpdate();
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false);
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect');
			await setSettingValueById(api, 'Accounts_OAuth_Proxy_services', '');
		});

		test('redirect login through the proxy', async ({ page }) => {
			await test.step('expect Custom OAuth button to be visible', async () => {
				await page.goto('/home');
				await expect(poRegistration.btnLoginWithCustomOAuth).toBeVisible();
			});

			await test.step('expect authorize flow to be redirected through the proxy', async () => {
				await poRegistration.btnLoginWithCustomOAuth.click();
				await expect(page).toHaveURL(/^https:\/\/oauth-proxy\.rocket\.chat\/redirect\//);
			});
		});
	});

	test.describe('Iframe login', () => {
		test.beforeAll(async ({ api }) => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);
			await waitForServiceSettingsUpdate();
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false);
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect');
		});

		test('login flow in iframe', async ({ page }) => {
			await test.step('expect Custom OAuth button to be visible in iframe', async () => {
				await page.goto('/');
				await page.setContent(`<iframe title="login" src="${BASE_URL}/home" style="width: 800px; height: 600px"></iframe>`);
				await expect(page.frameLocator('iframe[title="login"]').getByRole('button', { name: 'Sign in with Test' })).toBeVisible();
			});

			await test.step('expect authorize flow to be started from the iframe', async () => {
				const [oauthRequest] = await Promise.all([
					page.waitForRequest(/https:\/\/(www\.)?rocket\.chat\/oauth\/authorize/),
					page.frameLocator('iframe[title="login"]').getByRole('button', { name: 'Sign in with Test' }).click(),
				]);

				expect(oauthRequest.url()).toMatch(/https:\/\/(www\.)?rocket\.chat\/oauth\/authorize/);
			});
		});
	});
});
