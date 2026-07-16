import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { setSettingValueById } from './utils/setSettingValueById';
import { setUserPreferences } from './utils/setUserPreferences';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('message-composer-history', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let otherChannel: string;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_AllowFeaturePreview', true);
		targetChannel = await createTargetChannel(api);
		otherChannel = await createTargetChannel(api);
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

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel);
		await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		await poHomeChannel.composer.inputMessage.click();
	});

	test('should undo and redo typed text', async ({ page }) => {
		const { inputMessage } = poHomeChannel.composer;

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

	test('should undo a formatting change in a single step', async () => {
		const { inputMessage } = poHomeChannel.composer;

		await inputMessage.pressSequentially('bold');
		await inputMessage.selectText();
		await poHomeChannel.composer.btnBoldFormatter.click();
		await expect(inputMessage).toContainText('*bold*');

		await inputMessage.focus();
		await inputMessage.press('ControlOrMeta+z');
		await expect(inputMessage).not.toContainText('*bold*');
		await expect(inputMessage).toContainText('bold');
	});

	test('should restore sent text with undo', async ({ page }) => {
		const { inputMessage } = poHomeChannel.composer;

		await inputMessage.pressSequentially('message to send');
		await page.keyboard.press('Enter');
		await expect(inputMessage).not.toContainText('message to send');

		await inputMessage.focus();
		await page.keyboard.press('ControlOrMeta+z');
		await expect(inputMessage).toContainText('message to send');
	});

	test('should reset history when switching rooms', async ({ page }) => {
		const { inputMessage } = poHomeChannel.composer;

		await inputMessage.pressSequentially('draft in first room');
		await expect(inputMessage).toContainText('draft in first room');

		await poHomeChannel.gotoChannel(otherChannel);
		await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		await poHomeChannel.composer.inputMessage.click();

		await page.keyboard.press('ControlOrMeta+z');
		await expect(poHomeChannel.composer.inputMessage).not.toContainText('draft in first room');
	});
});
