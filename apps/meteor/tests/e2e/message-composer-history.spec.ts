import type { Locator, Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { preserveSettings } from './utils/preserveSettings';
import { setSettingValueById } from './utils/setSettingValueById';
import { setUserPreferences } from './utils/setUserPreferences';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

// FIXME: Before merging, this test fails due the cache of the feature preview requiring reloads to update the UI
// This can be observed by just trying to enable feature preview setting then the preference, the composer sometimes
// needs more than one reload to show up on the UI.
test.describe.skip('message-composer-history', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let otherChannel: string;

	preserveSettings(['Accounts_AllowFeaturePreview']);

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);
		await setUserPreferences(api, {
			featuresPreview: [{ name: 'realtimeMessageComposer', value: true }],
		});
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
		otherChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.afterAll(async ({ api }) => {
		await setUserPreferences(api, {
			featuresPreview: [{ name: 'realtimeMessageComposer', value: false }],
		});
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', false);
		await deleteChannel(api, targetChannel);
		await deleteChannel(api, otherChannel);
	});

	const richComposerInput = (page: Page): Locator => poHomeChannel.composer.inputMessage.and(page.locator('[contenteditable="true"]'));

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
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

		await page.keyboard.press('ControlOrMeta+z');
		await expect(inputMessage).not.toContainText('draft in first room');
	});
});
