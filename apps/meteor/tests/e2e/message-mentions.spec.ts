import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('message-mentions', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect show "all" and "here" options', async () => {
		await poHomeChannel.sidenav.openChat('general');
		await poHomeChannel.content.inputMessage.type('@');

		await expect(poHomeChannel.content.messagePopUpItems.locator('text=all')).toBeVisible();
		await expect(poHomeChannel.content.messagePopUpItems.locator('text=here')).toBeVisible();
	});
});
