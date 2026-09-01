import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { preserveSettings } from './utils/preserveSettings';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('auto-translate', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	preserveSettings(['AutoTranslate_Enabled']);

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test.describe('with the setting disabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'AutoTranslate_Enabled', false);
		});

		test('should not offer auto-translate in the room options', async () => {
			await poHomeChannel.gotoChannel(targetChannel);
			await poHomeChannel.roomToolbar.openMoreOptions();

			await expect(poHomeChannel.roomToolbar.menuItemAutoTranslate).not.toBeVisible();
		});
	});

	test.describe('with the setting enabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'AutoTranslate_Enabled', true);
		});

		test('should keep translation enabled after reopening the room', async () => {
			await poHomeChannel.gotoChannel(targetChannel);
			await poHomeChannel.roomToolbar.openMoreOptions();
			await poHomeChannel.roomToolbar.menuItemAutoTranslate.click();
			await poHomeChannel.tabs.autoTranslate.waitForDisplay();
			await poHomeChannel.tabs.autoTranslate.setAutomaticTranslation(true);

			await poHomeChannel.page.reload();
			await poHomeChannel.tabs.autoTranslate.waitForDisplay();

			await expect(poHomeChannel.tabs.autoTranslate.checkboxAutomaticTranslation).toBeChecked();
		});

		test('should warn and block the toggle in an encrypted room', async ({ api }) => {
			const encryptedChannel = await createTargetChannel(api, { extraData: { encrypted: true } });

			await poHomeChannel.gotoChannel(encryptedChannel);
			await poHomeChannel.roomToolbar.openMoreOptions();
			await poHomeChannel.roomToolbar.menuItemAutoTranslate.click();
			await poHomeChannel.tabs.autoTranslate.waitForDisplay();

			await expect(poHomeChannel.tabs.autoTranslate.calloutEncryptedRoom).toBeVisible();
			await expect(poHomeChannel.tabs.autoTranslate.checkboxAutomaticTranslation).toBeDisabled();

			await deleteChannel(api, encryptedChannel);
		});
	});
});
