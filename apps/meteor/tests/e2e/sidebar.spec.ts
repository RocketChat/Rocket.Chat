import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('sidebar', () => {
	let poHomeDiscussion: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeDiscussion = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should navigate on sidebar toolbar using arrow keys', async ({ page }) => {
		await poHomeDiscussion.content.waitForPageLoad();
		await poHomeDiscussion.navbar.homeButton.focus();
		await page.keyboard.press('ArrowRight');
		await expect(poHomeDiscussion.navbar.directoryButton).toBeFocused();
	});

	test('should navigate on sidebar items using arrow keys and restore focus', async ({ page }) => {
		// focus should be on the next item
		await poHomeDiscussion.sidebar.channelsList.getByRole('link').first().focus();
		await page.keyboard.press('ArrowDown');
		await expect(poHomeDiscussion.sidebar.channelsList.getByRole('link').first()).not.toBeFocused();

		// shouldn't focus the first item
		await page.keyboard.press('Shift+Tab');
		await page.keyboard.press('Tab');
		await expect(poHomeDiscussion.sidebar.channelsList.getByRole('link').first()).not.toBeFocused();
	});
});
