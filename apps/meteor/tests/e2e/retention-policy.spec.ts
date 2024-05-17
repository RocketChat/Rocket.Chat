import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('retention-policy', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
    await setSettingValueById(api, 'RetentionPolicy_Enabled', true);
    
		targetChannel = await createTargetChannel(api);
	});

  test.afterAll(async ({ api }) => {
    await setSettingValueById(api, 'RetentionPolicy_Enabled', false);
  });

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should enable prune old messages', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
    await poHomeChannel.tabs.room.pruneAccordion.click();
    await poHomeChannel.tabs.room.checkboxPruneMessages.click();
		await poHomeChannel.tabs.room.btnSave.click();
		await poHomeChannel.tabs.btnRoomInfo.click();

		await expect(poHomeChannel.tabs.room.alertRetentionPolicy).toBeVisible();
	});
});
