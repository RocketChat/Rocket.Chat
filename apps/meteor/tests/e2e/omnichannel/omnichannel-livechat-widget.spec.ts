import type { Page } from '@playwright/test';

import { OmnichannelLiveChatEmbedded } from '../page-objects';
import { test, expect } from '../utils/test';

test.describe('Omnichannel - Livechat Widget Embedded', () => {
	test.describe('Widget is working on Embedded View', () => {
		let page: Page;
		let poLiveChat: OmnichannelLiveChatEmbedded;

		test.beforeAll(async ({ browser }) => {
			page = await browser.newPage();
			poLiveChat = new OmnichannelLiveChatEmbedded(page);

			await page.goto('/packages/rocketchat_livechat/assets/demo.html');
		});

		test.afterAll(async () => {
			await page.close();
		});

		test('Open and Close widget', async () => {
			await test.step('Expect widget to be visible while embedded in an iframe', async () => {
				await expect(poLiveChat.btnOpenLiveChat()).toBeVisible();
			});
		});
	});
});
