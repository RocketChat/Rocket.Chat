import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetPrivateChannel, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('retention-policy', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetGroup: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		targetGroup = await createTargetPrivateChannel(api);
	})

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.describe('retention policy disabled', () => {
		test('should not show prune banner in channel', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();
		});

		test('should not show prune section on edit channel', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnRoomInfo.click();
			await poHomeChannel.tabs.room.btnEdit.click();

			await expect(poHomeChannel.tabs.room.pruneAccordion).not.toBeVisible();
		});
	});

	test.describe('retention policy enabled', () => {	
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'RetentionPolicy_Enabled', true);
		})
		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'RetentionPolicy_Enabled', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToChannels', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToGroups', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToDMs', false);
			await setSettingValueById(api, 'RetentionPolicy_MaxAge_Channels', 30);
		});

		test('should not show prune banner even with retention policy setting enabled in any type of room', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.sidenav.openChat(targetGroup);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.sidenav.openChat('user1');
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();
		});

		test('should show prune section in edit channel', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnRoomInfo.click();
			await poHomeChannel.tabs.room.btnEdit.click();

			await expect(poHomeChannel.tabs.room.pruneAccordion).toBeVisible();
		});

		test.describe('retention policy applies enabled by default', () => {
			test.beforeAll(async ({ api }) => {
				await setSettingValueById(api, 'RetentionPolicy_AppliesToChannels', true);
				await setSettingValueById(api, 'RetentionPolicy_AppliesToGroups', true);
				await setSettingValueById(api, 'RetentionPolicy_AppliesToDMs', true);
			});

			test('should prune old messages checkbox enabled by default in channel and show retention policy banner', async () => {
				await poHomeChannel.sidenav.openChat(targetChannel);
				await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();
	
				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();
				await expect(poHomeChannel.tabs.room.checkboxPruneMessages).toBeChecked();
			});

			test('should prune old messages checkbox enabled by default in group and show retention policy banner', async () => {
				await poHomeChannel.sidenav.openChat(targetGroup);
				await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();
	
				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();
				await expect(poHomeChannel.tabs.room.checkboxPruneMessages).toBeChecked();
			});

			test('should show retention policy banner in DMs', async () => {
				await poHomeChannel.sidenav.openChat('user1');
				await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();
			});
		});

		test.describe('retention policy override', () => {
			test.beforeAll(async ({ api }) => {
				expect((await setSettingValueById(api, 'RetentionPolicy_MaxAge_Channels', 15)).status()).toBe(200);
			});

			test('should display the default max age in edit channel', async () => {
				await poHomeChannel.sidenav.openChat(targetChannel);
				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();
				await poHomeChannel.tabs.room.checkboxOverrideGlobalRetention.click();
	
				await expect(poHomeChannel.tabs.room.getMaxAgeLabel('15')).toBeVisible();
			});
	
			test('should display overridden retention max age value', async () => {
				await poHomeChannel.sidenav.openChat(targetChannel);
				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();
				await poHomeChannel.tabs.room.checkboxOverrideGlobalRetention.click();
				await poHomeChannel.tabs.room.inputRetentionMaxAge.fill('365');
				await poHomeChannel.tabs.room.btnSave.click();
				await poHomeChannel.dismissToast();
	
				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();
	
				await expect(poHomeChannel.tabs.room.getMaxAgeLabel('15')).toBeVisible();
				await expect(poHomeChannel.tabs.room.inputRetentionMaxAge).toHaveValue('365');
			});
		});
	});
});
