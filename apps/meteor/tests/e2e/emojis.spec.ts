import { Users } from './fixtures/userStates';
import { HomeChannel, AdminEmoji } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('emoji', () => {
	let poHomeChannel: HomeChannel;
	let poAdminEmoji: AdminEmoji;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should display emoji picker properly', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.btnComposerEmoji.click();

		await test.step('should display scroller', async () => {
			await expect(poHomeChannel.content.scrollerEmojiPicker).toBeVisible();
		});

		await test.step('should focus the active emoji tab category', async () => {
			const activityEmojiTab = poHomeChannel.content.getEmojiPickerTabByName('Activity');
			await activityEmojiTab.click();

			await expect(activityEmojiTab).toBeFocused();
		});

		await test.step('should pick and send grinning emoji', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.pickEmoji('grinning');
			await page.keyboard.press('Enter');

			await expect(poHomeChannel.content.lastUserMessage).toContainText('😀');
		});
	});

	test('expect send emoji via text', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage(':innocent:');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessage).toContainText('😇');
	});

	test('expect render special characters and numbers properly', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.sendMessage('® © ™ # *');
		await expect(poHomeChannel.content.lastUserMessage).toContainText('® © ™ # *');
	});

	test('should add a custom emoji, send it, rename it, and check render', async ({ page }) => {
		const emojiName = 'customemoji';
		const newEmojiName = 'renamedemoji';
		const emojiUrl = './tests/e2e/fixtures/files/test-image.jpeg';

		poAdminEmoji = new AdminEmoji(page);

		// Add custom emoji
		await poHomeChannel.sidenav.openAdministrationByLabel('Workspace');
		await page.locator('role=link[name="Emoji"]').click();
		await poAdminEmoji.newButton.click();
		await poAdminEmoji.addEmoji.nameInput.fill(emojiName);

		const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('role=button[name="Custom Emoji"]').click()]);
		await fileChooser.setFiles(emojiUrl);

		await poAdminEmoji.addEmoji.btnSave.click();
		await poAdminEmoji.closeAdminButton.click();

		await poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.sendMessage(`:${emojiName}:`);
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastUserMessage.getByTestId(emojiName)).toBeVisible();

		// Rename custom emoji
		await poHomeChannel.sidenav.openAdministrationByLabel('Workspace');
		await page.locator('role=link[name="Emoji"]').click();
		await poAdminEmoji.findEmojiByName(emojiName);
		await poAdminEmoji.addEmoji.nameInput.fill(newEmojiName);

		await poAdminEmoji.addEmoji.btnSave.click();
		await poAdminEmoji.closeAdminButton.click();

		await poHomeChannel.sidenav.openChat(targetChannel);

		await poHomeChannel.content.sendMessage(`:${newEmojiName}:`);
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastUserMessage.getByTestId(newEmojiName)).toBeVisible();

		// Remove custom emoji
		await poHomeChannel.sidenav.openAdministrationByLabel('Workspace');
		await page.locator('role=link[name="Emoji"]').click();
		await poAdminEmoji.findEmojiByName(newEmojiName);
		await poAdminEmoji.addEmoji.btnDelete.click();
	});
});
