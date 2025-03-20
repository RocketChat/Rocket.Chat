import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('channel-direct-message', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect create a direct room', async ({ page }) => {
		await poHomeChannel.sidenav.openNewByLabel('Direct message');

		await poHomeChannel.sidenav.inputDirectUsername.click();
		await page.keyboard.type('rocket.cat');
		await page.waitForTimeout(200);
		await page.keyboard.press('Enter');
		await poHomeChannel.sidenav.btnCreate.click();

		await expect(page).toHaveURL('direct/rocket.catrocketchat.internal.admin.test');
	});
});
