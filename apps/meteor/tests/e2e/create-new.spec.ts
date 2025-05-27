import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('menu-create-new', () => {
	let page: Page;

	test.beforeEach(async ({ browser }) => {
		const reactDevTools = await fetch('http://localhost:8097');
		const context = await browser.newContext();
		page = await context.newPage();
		if (reactDevTools.ok) {
			const content = await reactDevTools.text();
			await page.addInitScript({ content });
		}

		// Create a new page in the context

		const client = await page.context().newCDPSession(page);
		await client.send('Network.clearBrowserCache');
		await client.send('Network.emulateNetworkConditions', {
			connectionType: 'cellular4g',
			offline: false,
			latency: 50,
			downloadThroughput: 200 * 1024, // 100 Kbps
			uploadThroughput: 200 * 1024, // 100 Kbps
		});

		await page.goto('/home', { waitUntil: 'domcontentloaded' });
		await page.getByRole('alert', { name: 'loading' }).waitFor({ state: 'hidden' });
	});

	test.afterEach(async () => {
		await page.close();
	});

	test('expect create a direct room', async () => {
		await page.getByRole('button', { name: 'Create new' }).click();
		await page.getByRole('menuitem', { name: 'Direct message' }).click({ timeout: 100 });
		await expect(page.getByRole('dialog')).toContainText('New direct message');
	});
});
