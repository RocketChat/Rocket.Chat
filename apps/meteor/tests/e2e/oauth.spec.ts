import { randomUUID } from 'crypto';

import type { IUser, LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { BASE_URL, IS_EE, MOCK_SERVER_URL_FROM_SERVER } from './config/constants';
import { Registration } from './page-objects';
import { getSettingValueById } from './utils/getSettingValueById';
import { setSettingValueById } from './utils/setSettingValueById';
import type { BaseTest } from './utils/test';
import { test, expect } from './utils/test';
import { mockServerReset, mockServerSetMany } from '../data/mock-server.helper';

type ServiceConfigurations = {
	configurations: Array<LoginServiceConfiguration & { loginStyle?: string }>;
};

const customOAuthAuthorizeUrlPattern = /https:\/\/(www\.)?rocket\.chat\/(oauth\/)?authorize/;
const googleOAuthService = 'google';
const customOAuthService = 'test';

const getOAuthService = async (
	api: BaseTest['api'],
	service: string,
): Promise<ServiceConfigurations['configurations'][number] | undefined> => {
	const response = await api.get('/service.configurations');
	await expect(response).toBeOK();
	const { configurations } = (await response.json()) as ServiceConfigurations;

	return configurations.find((configuration) => configuration.service === service);
};

const getOAuthServiceLoginStyle = async (api: BaseTest['api'], serviceName: string): Promise<string | undefined> => {
	return (await getOAuthService(api, serviceName))?.loginStyle;
};

test.describe('OAuth', () => {
	// Custom OAuth requires the `oauth-enterprise` module since 9.0.0
	test.skip(!IS_EE);

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
				await expect.poll(async () => (await getOAuthService(api, googleOAuthService))?.service).toBe(googleOAuthService);

				await poRegistration.goto();

				await expect(poRegistration.btnLoginWithGoogle).toBeVisible();
			});

			await test.step('expect Custom OAuth button to be visible', async () => {
				await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);
				await expect.poll(async () => (await getOAuthService(api, customOAuthService))?.service).toBe(customOAuthService);
				await poRegistration.goto();

				await expect(poRegistration.btnLoginWithCustomOAuth).toBeVisible();
			});

			await test.step('expect redirect to the configured URL.', async () => {
				await poRegistration.btnLoginWithCustomOAuth.click();
				await expect(page).toHaveURL(customOAuthAuthorizeUrlPattern);
			});

			await test.step('expect OAuth button to not be visible', async () => {
				await expect((await setSettingValueById(api, 'Accounts_OAuth_Google', false)).status()).toBe(200);
				await expect.poll(() => getOAuthService(api, googleOAuthService)).toBeUndefined();

				await poRegistration.goto();
				await expect(poRegistration.btnLoginWithGoogle).not.toBeVisible();
			});

			await test.step('expect Custom OAuth button to not be visible', async () => {
				await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false)).status()).toBe(200);
				await expect.poll(() => getOAuthService(api, customOAuthService)).toBeUndefined();

				await poRegistration.goto();
				await expect(poRegistration.btnLoginWithCustomOAuth).not.toBeVisible();
			});
		});
	});

	test.describe('Pop-up login style', () => {
		test.beforeAll(async ({ api }) => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'popup')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);
			await expect.poll(() => getOAuthServiceLoginStyle(api, customOAuthService)).toBe('popup');
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false);
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect');
		});

		test('open authorize flow in a popup', async ({ page }) => {
			await test.step('expect Custom OAuth button to be visible', async () => {
				await poRegistration.goto();
				await expect(poRegistration.btnLoginWithCustomOAuth).toBeVisible();
			});

			await test.step('expect authorize flow to be opened in a popup', async () => {
				const [popup] = await Promise.all([page.waitForEvent('popup'), poRegistration.btnLoginWithCustomOAuth.click()]);

				await expect(popup).toHaveURL(customOAuthAuthorizeUrlPattern);
				await expect(page).toHaveURL(/\/home/);
				await popup.close();
			});
		});
	});

	test.describe('First login', () => {
		const runId = randomUUID();
		const providerPath = `/custom-oauth-e2e/${runId}`;
		const identity = { id: `custom-oauth-e2e-${runId}`, name: 'Custom OAuth First Login', email: `${runId}@custom-oauth.example.com` };
		let userId: string | null = null;

		const providerSettings = {
			'Accounts_OAuth_Custom-Test-url': MOCK_SERVER_URL_FROM_SERVER,
			'Accounts_OAuth_Custom-Test-token_path': `${providerPath}/token`,
			'Accounts_OAuth_Custom-Test-identity_path': `${providerPath}/me`,
			'Accounts_OAuth_Custom-Test-identity_token_sent_via': 'header',
			'Accounts_OAuth_Custom-Test-login_style': 'redirect',
		};
		const originalSettings: Record<string, unknown> = {};

		const getProviderEndpoints = async (api: BaseTest['api']) => {
			const service = await getOAuthService(api, customOAuthService);
			return service && 'tokenPath' in service
				? { serverURL: service.serverURL, tokenPath: service.tokenPath, identityPath: service.identityPath }
				: undefined;
		};

		test.beforeAll(async ({ api }) => {
			await mockServerSetMany([
				{ method: 'POST', path: `${providerPath}/token`, body: { access_token: `token-${runId}`, token_type: 'Bearer' } },
				{ method: 'GET', path: `${providerPath}/me`, body: identity },
			]);

			for (const [setting, value] of Object.entries(providerSettings)) {
				originalSettings[setting] = await getSettingValueById(api, setting);
				await expect((await setSettingValueById(api, setting, value)).status()).toBe(200);
			}
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);

			await expect
				.poll(() => getProviderEndpoints(api))
				.toEqual({ serverURL: MOCK_SERVER_URL_FROM_SERVER, tokenPath: `${providerPath}/token`, identityPath: `${providerPath}/me` });
		});

		test.afterAll(async ({ api }) => {
			for (const [setting, value] of Object.entries(originalSettings)) {
				await setSettingValueById(api, setting, value);
			}
			// The service reloads on a debounce; the tests that follow only wait for it to be enabled, so it must be back on the original provider first
			await expect
				.poll(() => getProviderEndpoints(api))
				.toEqual({
					serverURL: originalSettings['Accounts_OAuth_Custom-Test-url'],
					tokenPath: originalSettings['Accounts_OAuth_Custom-Test-token_path'],
					identityPath: originalSettings['Accounts_OAuth_Custom-Test-identity_path'],
				});
			await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', false);
			await mockServerReset();
			if (userId) {
				await api.post('/users.delete', { userId });
			}
		});

		test('creates a new user with the defaults of any new user', async ({ page, api }) => {
			const providerHost = new URL(MOCK_SERVER_URL_FROM_SERVER).host;

			await test.step('expect the login to complete', async () => {
				await poRegistration.goto();
				// page.route can't intercept a redirect's target, so the authorize request goes out and the goto below replaces it
				const [authorizeRequest] = await Promise.all([
					page.waitForRequest((request) => {
						const url = new URL(request.url());
						return url.host === providerHost && url.pathname === '/authorize';
					}),
					poRegistration.btnLoginWithCustomOAuth.click({ noWaitAfter: true }),
				]);

				// Stands in for the provider's consent page, which would send the browser back with a code and the same state
				const authorizeURL = new URL(authorizeRequest.url());
				const callbackURL = new URL(authorizeURL.searchParams.get('redirect_uri') ?? `${BASE_URL}/_oauth/${customOAuthService}`);
				callbackURL.searchParams.set('code', `code-${runId}`);
				callbackURL.searchParams.set('state', authorizeURL.searchParams.get('state') ?? '');
				await page.goto(callbackURL.toString());

				await expect(page).toHaveURL(/\/home/);
				await expect(page).not.toHaveURL(/oauthError/);
				await expect.poll(() => page.evaluate(() => localStorage.getItem('Meteor.userId'))).not.toBeNull();
				userId = await page.evaluate(() => localStorage.getItem('Meteor.userId'));
			});

			await test.step('expect the new user to be an active user with the user role', async () => {
				const response = await api.get(`/users.info?userId=${userId}`);
				await expect(response).toBeOK();
				const { user } = (await response.json()) as { user: IUser };

				expect(user).toMatchObject({ type: 'user', active: true, name: identity.name });
				expect(user.roles).toContain('user');
				expect(user.emails?.[0]?.address).toBe(identity.email);
			});
		});
	});

	test.describe('Iframe login', () => {
		test.beforeAll(async ({ api }) => {
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test-login_style', 'redirect')).status()).toBe(200);
			await expect((await setSettingValueById(api, 'Accounts_OAuth_Custom-Test', true)).status()).toBe(200);
			await expect.poll(() => getOAuthServiceLoginStyle(api, customOAuthService)).toBe('redirect');
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
					page.waitForRequest(customOAuthAuthorizeUrlPattern),
					page.frameLocator('iframe[title="login"]').getByRole('button', { name: 'Sign in with Test' }).click(),
				]);

				expect(oauthRequest.url()).toMatch(customOAuthAuthorizeUrlPattern);
			});
		});
	});
});
