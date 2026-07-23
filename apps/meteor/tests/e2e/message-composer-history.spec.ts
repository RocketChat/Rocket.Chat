import type { Locator, Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { preserveSettings } from './utils/preserveSettings';
import { setSettingValueById } from './utils/setSettingValueById';
import { setUserPreferences } from './utils/setUserPreferences';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('message-composer-history', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let otherChannel: string;

	preserveSettings(['Accounts_AllowFeaturePreview']);

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
		otherChannel = await createTargetChannel(api, { members: ['user1'] });
		await setUserPreferences(api, {
			featuresPreview: [{ name: 'realtimeMessageComposer', value: true }],
		});
	});

	test.afterAll(async ({ api }) => {
		await setUserPreferences(api, {
			featuresPreview: [{ name: 'realtimeMessageComposer', value: false }],
		});
		await deleteChannel(api, targetChannel);
		await deleteChannel(api, otherChannel);
	});

	// The real-time composer is a contenteditable span. Its placeholder sibling shares the
	// `name="msg"` attribute, so scope to the contenteditable one. A zero-match here also fails
	// loudly if the feature preview did not render the new component (textarea has no contenteditable).
	const richComposerInput = (page: Page): Locator => poHomeChannel.composer.inputMessage.and(page.locator('[contenteditable="true"]'));

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel);
		await expect(richComposerInput(page)).toBeVisible();
		await richComposerInput(page).click();
	});

	test('should undo and redo typed text', async ({ page }) => {
		const inputMessage = richComposerInput(page);

		await inputMessage.pressSequentially('hello world');
		await expect(inputMessage).toContainText('world');

		await page.keyboard.press('ControlOrMeta+z');
		await expect(inputMessage).not.toContainText('world');
		await expect(inputMessage).toContainText('hello');

		await page.keyboard.press('ControlOrMeta+z');
		await expect(inputMessage).not.toContainText('hello');

		await page.keyboard.press('ControlOrMeta+Shift+z');
		await expect(inputMessage).toContainText('hello');

		await page.keyboard.press('ControlOrMeta+Shift+z');
		await expect(inputMessage).toContainText('world');
	});

	test('should undo a formatting change in a single step', async ({ page }) => {
		const inputMessage = richComposerInput(page);

		await inputMessage.pressSequentially('bold');
		// Use the keyboard shortcut instead of the toolbar button: clicking the button blurs the
		// contenteditable and collapses the selection, so wrapSelection has nothing to wrap.
		await page.keyboard.press('ControlOrMeta+a');
		await page.keyboard.press('ControlOrMeta+b');
		await expect(inputMessage).toContainText('*bold*');

		await page.keyboard.press('ControlOrMeta+z');
		await expect(inputMessage).not.toContainText('*bold*');
		await expect(inputMessage).toContainText('bold');
	});

	test('should restore sent text with undo', async ({ page }) => {
		const inputMessage = richComposerInput(page);

		await inputMessage.pressSequentially('message to send');
		await page.keyboard.press('Enter');
		await expect(inputMessage).not.toContainText('message to send');

		await inputMessage.focus();
		await page.keyboard.press('ControlOrMeta+z');
		await expect(inputMessage).toContainText('message to send');
	});

	test('should reset history when switching rooms', async ({ page }) => {
		const inputMessage = richComposerInput(page);

		await inputMessage.pressSequentially('draft in first room');
		await expect(inputMessage).toContainText('draft in first room');

		await poHomeChannel.gotoChannel(otherChannel);
		await expect(inputMessage).toBeVisible();
		await inputMessage.click();

		await page.keyboard.press('ControlOrMeta+z');
		await expect(inputMessage).not.toContainText('draft in first room');
	});
});
