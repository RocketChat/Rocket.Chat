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
		await poHomeChannel.navbar.createNewDM('rocket.cat');
		await expect(page).toHaveURL(/direct\/.*/);
	});
});
