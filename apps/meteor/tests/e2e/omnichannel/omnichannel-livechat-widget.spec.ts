import type { Page } from '@playwright/test';

import { test, expect } from '../utils/test';

test.describe('Omnichannel - Livechat Widget Embedded', () => {
	test.describe('Widget is working on Embedded View', () => {
		let page: Page;
        let siteName: string;

		test.beforeAll(async ({ browser, api }) => {
			page = await browser.newPage();
            await expect((await api.post('/settings/Enable_CSP', { value: false })).status()).toBe(200);
            const { value } = await(await api.get('/settings/Site_Name')).json();
            siteName = value;


			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterAll(async ({ api }) => {
            await expect((await api.post('/settings/Enable_CSP', { value: true })).status()).toBe(200);
			await page.close();
		});

		test('Open and Close widget', async () => {
			await test.step('Expect widget to be visible while embedded in an iframe', async () => {
				await expect(page.frameLocator('#rocketchat-iframe').locator(`role=button[name="${siteName}"]`)).toBeVisible();
			});
		});
	});
});
