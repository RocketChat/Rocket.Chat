import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('message-mentions', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect show "all" and "here" options', async () => {
		await poHomeChannel.sidenav.openChat('general');
		await poHomeChannel.content.inputMessage.type('@');

		await expect(poHomeChannel.content.messagePopupUsers.locator('role=listitem >> text="all"')).toBeVisible();
		await expect(poHomeChannel.content.messagePopupUsers.locator('role=listitem >> text="here"')).toBeVisible();
	});
});
