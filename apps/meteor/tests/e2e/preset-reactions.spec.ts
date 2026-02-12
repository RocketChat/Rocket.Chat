import { expect, test } from './utils/test';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: Users.user1.state });

test.describe.serial('preset-reactions', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test('should have preset reactions button in composer toolbar', async ({ page }) => {
		// Look for the "more actions" button in the composer
		const moreActionsButton = page.locator('[data-qa-id="menu-more-actions"]');
		await expect(moreActionsButton).toBeVisible();
		
		// Click to open the menu
		await moreActionsButton.click();
		
		// Look for preset reactions option in the menu
		const presetReactionsOption = page.getByText('Preset Reactions');
		await expect(presetReactionsOption).toBeVisible();
	});

	test('should open preset reactions modal when clicking the button', async ({ page }) => {
		// Open the more actions menu
		const moreActionsButton = page.locator('[data-qa-id="menu-more-actions"]');
		await moreActionsButton.click();
		
		// Click preset reactions option
		const presetReactionsOption = page.getByText('Preset Reactions');
		await presetReactionsOption.click();
		
		// Modal should be visible
		await expect(page.getByText('Select Preset Reactions')).toBeVisible();
		await expect(page.getByText('Select reactions to show as suggestions')).toBeVisible();
	});

	test('should allow selecting preset reactions in modal', async ({ page }) => {
		// Open preset reactions modal
		const moreActionsButton = page.locator('[data-qa-id="menu-more-actions"]');
		await moreActionsButton.click();
		const presetReactionsOption = page.getByText('Preset Reactions');
		await presetReactionsOption.click();
		
		// Wait for modal
		await expect(page.getByText('Select Preset Reactions')).toBeVisible();
		
		// Click on some emojis (they're rendered as text like "+1", "heart", etc.)
		// The emojis are in the available reactions section
		const availableSection = page.locator('text=Available').locator('..');
		
		// Select first few emojis by clicking in the area
		// Since emojis are rendered as their shortcode without colons, we need to find them
		await page.locator('text=Available').locator('..').locator('div').first().click();
		
		// Confirm selection
		await page.getByRole('button', { name: 'Confirm' }).click();
		
		// Modal should close
		await expect(page.getByText('Select Preset Reactions')).not.toBeVisible();
	});

	test('should send message with preset reactions', async ({ page, api }) => {
		// Open preset reactions modal
		const moreActionsButton = page.locator('[data-qa-id="menu-more-actions"]');
		await moreActionsButton.click();
		await page.getByText('Preset Reactions').click();
		
		// Wait for modal and select reactions
		await expect(page.getByText('Select Preset Reactions')).toBeVisible();
		
		// Click first emoji
		await page.locator('text=Available').locator('..').locator('div').first().click();
		
		// Confirm
		await page.getByRole('button', { name: 'Confirm' }).click();
		
		// Type and send message
		const messageText = `Test message with preset reactions ${Date.now()}`;
		await poHomeChannel.content.sendMessage(messageText);
		
		// Wait for message to appear
		await expect(page.locator('.rcx-message-body').last()).toContainText(messageText);
		
		// Check that preset reactions appear on the message
		// Reactions should be visible even with 0 count
		const lastMessage = page.locator('[data-qa-type="message"]').last();
		await expect(lastMessage.locator('[class*="MessageReaction"]')).toBeVisible();
	});

	test('should display preset reactions with 0 count', async ({ page }) => {
		// Open preset reactions modal
		const moreActionsButton = page.locator('[data-qa-id="menu-more-actions"]');
		await moreActionsButton.click();
		await page.getByText('Preset Reactions').click();
		
		// Select reactions
		await expect(page.getByText('Select Preset Reactions')).toBeVisible();
		await page.locator('text=Available').locator('..').locator('div').first().click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		
		// Send message
		const messageText = `Preset reactions test ${Date.now()}`;
		await poHomeChannel.content.sendMessage(messageText);
		
		// Wait for message
		await expect(page.locator('.rcx-message-body').last()).toContainText(messageText);
		
		// Find the last message and check for reaction with counter showing 0
		const lastMessage = page.locator('[data-qa-type="message"]').last();
		const reactionCounter = lastMessage.locator('[class*="MessageReactionCounter"]').first();
		
		// Counter should show 0
		await expect(reactionCounter).toContainText('0');
	});

	test('should allow users to react to preset reactions', async ({ page }) => {
		// Set up preset reactions and send message
		const moreActionsButton = page.locator('[data-qa-id="menu-more-actions"]');
		await moreActionsButton.click();
		await page.getByText('Preset Reactions').click();
		await expect(page.getByText('Select Preset Reactions')).toBeVisible();
		
		// Select first emoji
		await page.locator('text=Available').locator('..').locator('div').first().click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		
		// Send message
		const messageText = `React to preset ${Date.now()}`;
		await poHomeChannel.content.sendMessage(messageText);
		await expect(page.locator('.rcx-message-body').last()).toContainText(messageText);
		
		// Click on the preset reaction to react
		const lastMessage = page.locator('[data-qa-type="message"]').last();
		const presetReaction = lastMessage.locator('[class*="MessageReaction"]').first();
		await presetReaction.click();
		
		// Counter should now show 1
		const reactionCounter = lastMessage.locator('[class*="MessageReactionCounter"]').first();
		await expect(reactionCounter).toContainText('1');
	});

	test('should keep preset reaction visible when count returns to 0', async ({ page }) => {
		// Set up preset reactions and send message
		const moreActionsButton = page.locator('[data-qa-id="menu-more-actions"]');
		await moreActionsButton.click();
		await page.getByText('Preset Reactions').click();
		await expect(page.getByText('Select Preset Reactions')).toBeVisible();
		
		// Select emoji
		await page.locator('text=Available').locator('..').locator('div').first().click();
		await page.getByRole('button', { name: 'Confirm' }).click();
		
		// Send message
		const messageText = `Unreact test ${Date.now()}`;
		await poHomeChannel.content.sendMessage(messageText);
		await expect(page.locator('.rcx-message-body').last()).toContainText(messageText);
		
		// React
		const lastMessage = page.locator('[data-qa-type="message"]').last();
		const presetReaction = lastMessage.locator('[class*="MessageReaction"]').first();
		await presetReaction.click();
		
		// Verify count is 1
		let reactionCounter = lastMessage.locator('[class*="MessageReactionCounter"]').first();
		await expect(reactionCounter).toContainText('1');
		
		// Unreact by clicking again
		await presetReaction.click();
		
		// Reaction should still be visible
		await expect(presetReaction).toBeVisible();
		
		// Counter should show 0
		reactionCounter = lastMessage.locator('[class*="MessageReactionCounter"]').first();
		await expect(reactionCounter).toContainText('0');
	});
});
