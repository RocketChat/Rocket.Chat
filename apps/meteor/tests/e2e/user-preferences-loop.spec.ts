import type { Request } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel, Registration } from './page-objects';
import { setUserPreferences } from './utils/setUserPreferences';
import { test, expect } from './utils/test';

test.describe('User Preferences Flood', () => {
	test.use({ storageState: Users.user1.state });

	test('should not flood users.setPreferences calls', async ({ browser, api }) => {
		await test.step('Reset user language to "en"', async () => {
			await api.login({ username: 'user1', password: DEFAULT_USER_CREDENTIALS.password });
			const resetResponse = await setUserPreferences(api, { language: 'en' });
			expect(resetResponse.status()).toBe(200);
		});

		const context = await browser.newContext();
		const requests: Request[] = [];

		await test.step('Setup request interception', async () => {
			await context.route('**/users.setPreferences', async (route) => {
				requests.push(route.request());
				await route.continue();
			});
		});

		const page1 = await context.newPage();
		const page2 = await context.newPage();
		const page3 = await context.newPage();
		const pages = [page1, page2, page3];

		await test.step('Open three tabs of the workspace', async () => {
			await Promise.all(pages.map((page) => page.goto('/home')));
		});

		await test.step('Log in to the workspace on one of the tabs', async () => {
			const poHomeChannel1 = new HomeChannel(page1);
			await poHomeChannel1.sidenav.logout();
			const poRegistration1 = new Registration(page1);
			await poRegistration1.username.fill('user1');
			await poRegistration1.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration1.btnLogin.click();
			await expect(page1.locator('#main-content')).toBeVisible({ timeout: 30000 });
		});

		await test.step('Ensure other pages are logged in', async () => {
			await expect(page2.locator('#main-content')).toBeVisible({ timeout: 30000 });
		});

		await test.step('Inject conflicting state to simulate the bug conditions', async () => {
			// We set preferedLanguage to 'pt-BR' on page1.
			// This triggers a storage event in page2 and page3.
			// The key needs to be prefixed with 'fuselage-localStorage-' as per fuselage-hooks implementation
			await page1.evaluate(() => {
				window.localStorage.setItem('fuselage-localStorage-preferedLanguage', JSON.stringify('pt-BR'));
			});
		});

		await test.step('Verify requests count', async () => {
			// Wait a bit to allow all requests to be made
			await page1.waitForTimeout(5000);

			// Log the results
			// With the fix, we expect 0 requests here because the user is already logged in
			// and we ignore storage changes after initial sync.
			expect(requests.length).toBe(0);
		});

		await test.step('Verify Sync on Login', async () => {
			// Reset language to 'en' to ensure we have a diff
			const res = await setUserPreferences(api, { language: 'en' });
			expect(res.status()).toBe(200);

			const poHomeChannel1 = new HomeChannel(page1);
			await poHomeChannel1.sidenav.logout();

			// Set preference while logged out
			await page1.evaluate(() => {
				window.localStorage.setItem('fuselage-localStorage-preferedLanguage', JSON.stringify('pt-BR'));
			});

			// Reload to ensure UserProvider picks up the new localStorage value
			await page1.reload();

			// Login again
			const poRegistration1 = new Registration(page1);
			await poRegistration1.username.fill('user1');
			await poRegistration1.inputPassword.fill(DEFAULT_USER_CREDENTIALS.password);
			await poRegistration1.btnLogin.click();
			await expect(page1.locator('#main-content')).toBeVisible({ timeout: 30000 });

			// Wait for request
			await page1.waitForTimeout(5000);

			// Expect requests to have increased
			expect(requests.length).toBeGreaterThan(0);
			expect(requests.length).toBeLessThan(5);
		});

		await context.unroute('**/users.setPreferences');
		await context.close();
	});
});
