import fs from 'fs';
import path from 'path';

import { Users } from './fixtures/userStates';
import { Registration, Authenticated } from './page-objects';
import { test, expect } from './utils/test';

const IFRAME_URL = 'http://iframe.rocket.chat';
const API_URL = 'http://auth.rocket.chat/api/login';

test.describe('iframe-authentication', () => {
	let poRegistration: Registration;
	let poAuth: Authenticated;

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/Accounts_iframe_enabled', { value: true });
		await api.post('/settings/Accounts_iframe_url', { value: IFRAME_URL });
		await api.post('/settings/Accounts_Iframe_api_url', { value: API_URL });
		await api.post('/settings/Accounts_Iframe_api_method', { value: 'POST' });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/Accounts_iframe_enabled', { value: false });
		await api.post('/settings/Accounts_iframe_url', { value: '' });
		await api.post('/settings/Accounts_Iframe_api_url', { value: '' });
		await api.post('/settings/Accounts_Iframe_api_method', { value: '' });
	});

	test.beforeEach(async ({ page }) => {
		poRegistration = new Registration(page);
		poAuth = new Authenticated(page);

		await page.route(API_URL, async (route) => {
			await route.fulfill({
				status: 200,
			});
		});

		const htmlContent = fs
			.readFileSync(path.resolve(__dirname, 'fixtures/files/iframe-login.html'), 'utf-8')
			.replace('REPLACE_WITH_TOKEN', Users.user1.data.loginToken);

		await page.route(IFRAME_URL, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: htmlContent,
			});
		});
	});

	test('should render iframe instead of login page', async ({ page }) => {
		await page.goto('/home');

		await expect(poRegistration.loginIframeForm).toBeVisible();
	});

	test('should render iframe login page if API returns error', async ({ page }) => {
		await page.route(API_URL, async (route) => {
			await route.fulfill({
				status: 500,
			});
		});

		await page.goto('/home');

		await expect(poRegistration.loginIframeForm).toBeVisible();
	});

	test('should login with token when API returns valid token', async ({ page }) => {
		await page.route(API_URL, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ loginToken: Users.user1.data.loginToken }),
			});
		});

		await page.goto('/home');
		await poAuth.waitForDisplay();
	});

	test('should show login page when API returns invalid token', async ({ page }) => {
		await page.route(API_URL, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ loginToken: 'invalid-token' }),
			});
		});

		await page.goto('/home');
		await expect(poRegistration.loginIframeForm).toBeVisible();
	});

	test('should login through iframe', async ({ page }) => {
		await page.goto('/home');

		await expect(poRegistration.loginIframeForm).toBeVisible();

		await poRegistration.loginIframeSubmitButton.click();

		await poAuth.waitForDisplay();
	});

	test('should return error to iframe when login fails', async ({ page }) => {
		const htmlContent = fs.readFileSync(path.resolve(__dirname, 'fixtures/files/iframe-login.html'), 'utf-8');

		await page.route(IFRAME_URL, async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'text/html',
				body: htmlContent,
			});
		});

		await page.goto('/home');

		await expect(poRegistration.loginIframeForm).toBeVisible();

		await poRegistration.loginIframeSubmitButton.click();

		await expect(poRegistration.loginIframeError).toBeVisible();
	});

	test.describe('incomplete settings', () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/settings/Accounts_Iframe_api_url', { value: '' });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/settings/Accounts_Iframe_api_url', { value: API_URL });
		});

		test('should render default login page, if settings are incomplete', async ({ page }) => {
			const htmlContent = fs.readFileSync(path.resolve(__dirname, 'fixtures/files/iframe-login.html'), 'utf-8');

			await page.route(IFRAME_URL, async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'text/html',
					body: htmlContent,
				});
			});

			await page.goto('/home');
			await expect(poRegistration.btnLogin).toBeVisible();
			await expect(poRegistration.loginIframeForm).not.toBeVisible();
		});
	});
});
