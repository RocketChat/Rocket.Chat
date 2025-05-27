import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state, video: 'on' });

test.describe('menu-create-new', () => {
	let page: Page;

	test.beforeEach(async ({ browser }) => {
		const context = await browser.newContext();
		page = await context.newPage();

		await page.route('**/*', async (route) => {
			await new Promise((f) => setTimeout(f, 100));
			await route.continue();
		});

		await page.goto('/home');
	});

	test.afterEach(async () => {
		await page.close();
	});

	test.fail('expect create a direct room', async () => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await expect(page.getByRole('menu', { name: 'Create new' })).toBeVisible({ timeout: 1000 });
		await page.getByRole('menuitem', { name: 'Direct message' }).click({ timeout: 1000 });
		await expect(page.getByRole('dialog')).toHaveText('New direct message');
	});
});
