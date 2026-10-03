import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

// Example test file for bisecting
// Copy this file to the e2e tests folder or let the bisect script copy it.
test.describe.only('bisect', () => {
	let poHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should handle custom emoji correctly', async ({ page }) => {
		await poHomeChannel.sidenav.openChat('general');

		// Type custom emoji in message composer
		await poHomeChannel.content.inputMessage.pressSequentially(':point_left:');

		// Find the popup item for the custom emoji
		const popupItem = page.locator('li#popup-item-\\:point_left\\:');
		await expect(popupItem).toBeVisible();

		// Expect the popup item to have a span with emoji class and correct background-image
		const emojiSpan = popupItem.locator('span.emoji');
		await expect(emojiSpan).toBeVisible();
		await expect(emojiSpan).toHaveAttribute('style', /point_left/);

		// Click the popup item
		await popupItem.click();

		// Send the message
		await page.keyboard.press('Enter');

		// Find the emoji span in the last message
		const messageEmojiSpan = poHomeChannel.content.lastUserMessage.locator('span[title=":point_left:"] .emoji');
		await expect(messageEmojiSpan).toBeVisible();
		await expect(messageEmojiSpan).toHaveAttribute('style', /point_left/);
	});
});
