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

		});

		test('should not show prune banner even with global setting enabled in any type of room', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.sidenav.openChat(targetGroup);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.sidenav.openChat('user1');
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();
		});

		test('should not show prune section even with global setting enabled', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnRoomInfo.click();
			await poHomeChannel.tabs.room.btnEdit.click();

			await expect(poHomeChannel.tabs.room.pruneAccordion).not.toBeVisible();
		});

		test('should enabled prune old messages by default in channel', async ({ api }) => {
			expect((await setSettingValueById(api, 'RetentionPolicy_AppliesToChannels', true)).status()).toBe(200);

			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnRoomInfo.click();
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();

			await poHomeChannel.tabs.room.btnEdit.click();
			await poHomeChannel.tabs.room.pruneAccordion.click();
			await expect(poHomeChannel.tabs.room.checkboxPruneMessages).toBeChecked();
		});

		test('should enabled prune old messages by default in group', async ({ api }) => {
			expect((await setSettingValueById(api, 'RetentionPolicy_AppliesToGroups', true)).status()).toBe(200);

			await poHomeChannel.sidenav.openChat(targetGroup);
			await poHomeChannel.tabs.btnRoomInfo.click();
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();

			await poHomeChannel.tabs.room.btnEdit.click();
			await poHomeChannel.tabs.room.pruneAccordion.click();
			await expect(poHomeChannel.tabs.room.checkboxPruneMessages).toBeChecked();
		});

		test('should enabled prune old messages by default in DM', async ({ api }) => {
			expect((await setSettingValueById(api, 'RetentionPolicy_AppliesToDMs', true)).status()).toBe(200);

			await poHomeChannel.sidenav.openChat(targetGroup);
			await poHomeChannel.tabs.btnRoomInfo.click();
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();
		});

		// test('should enabled prune old messages by default on channel', async ({ api }) => {
		// 	expect((await setSettingValueById(api, 'RetentionPolicy_AppliesToChannels', true)).status()).toBe(200);

		// 	await poHomeChannel.sidenav.openChat(targetChannel);
		// 	await poHomeChannel.tabs.btnRoomInfo.click();
		// 	await poHomeChannel.tabs.room.btnEdit.click();


		// 	await poHomeChannel.tabs.room.pruneAccordion.click();
		// 	await poHomeChannel.tabs.room.checkboxPruneMessages.click();
		// 	await poHomeChannel.tabs.room.btnSave.click();
		// 	await poHomeChannel.tabs.btnRoomInfo.click();
	
		// 	await expect(poHomeChannel.tabs.room.alertRetentionPolicy).toBeVisible();
		// });
	})

	
});
