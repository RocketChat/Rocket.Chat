import type { Page } from '@playwright/test';

import { OmnichannelLiveChatEmbedded } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('OC - Livechat Widget Embedded', () => {
	test.describe('Widget is working on Embedded View', () => {
		let page: Page;
		let poLiveChat: OmnichannelLiveChatEmbedded;

		test.beforeAll(async ({ browser, api }) => {
			page = await browser.newPage();
			poLiveChat = new OmnichannelLiveChatEmbedded(page, api);

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterAll(async () => {
			await page.close();
		});

		test('OC - Livechat Widget Embedded - Open and close widget', async () => {
			await test.step('Expect widget to be visible while embedded in an iframe', async () => {
				await expect(poLiveChat.btnOpenLiveChat).toBeVisible();
			});
		});
	});
});
