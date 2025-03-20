import type { Page } from '@playwright/test';

import { ADMIN_CREDENTIALS, IS_EE } from '../config/constants';
import injectInitialData from '../fixtures/inject-initial-data';
import { test, expect } from '../utils/test';

test.describe('OC - Enterprise Menu Items After Relogin', () => {
	// Create page object and redirect to home
	test.beforeEach(async ({ page }: { page: Page }) => {
		await page.goto('/omnichannel/current');

		await page.locator('role=textbox[name=/username/i]').waitFor({ state: 'visible' });
		await page.locator('role=textbox[name=/username/i]').fill(ADMIN_CREDENTIALS.email);
		await page.locator('[name=password]').fill(ADMIN_CREDENTIALS.password);
		await page.locator('role=button[name="Login"]').click();

		await page.locator('.main-content').waitFor();
	});

	// Delete all data
	test.afterAll(async () => {
		await injectInitialData();
	});

	test('OC - Enterprise Menu Items - Logout & Login', async ({ page }) => {
		test.skip(!IS_EE);
		await test.step('expect EE menu items to be visible', async () => {
			await expect(page.locator('a[href="/omnichannel/tags"]')).toBeVisible();
		});
	});
});
