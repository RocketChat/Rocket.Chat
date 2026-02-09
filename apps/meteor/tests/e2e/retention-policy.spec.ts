import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel, HomeTeam } from './page-objects';
import { createTargetTeam, createTargetPrivateChannel, getSettingValueById, setSettingValueById } from './utils';
import { test, expect } from './utils/test';
import { timeUnitToMs, TIMEUNIT } from '../../client/lib/convertTimeUnit';

test.use({ storageState: Users.admin.state });

test.describe.serial('retention-policy', () => {
	let poHomeChannel: HomeChannel;
	const targetChannel = faker.string.uuid();
	let targetTeam: string;
	let targetGroup: string;

	test.beforeAll(async ({ api }) => {
		const response = await api.post('/channels.create', { name: targetChannel, members: ['user1'] });
		const { channel } = await response.json();
		await api.post('/channels.addOwner', { roomId: channel._id, userId: Users.user1.data._id });

		targetGroup = await createTargetPrivateChannel(api);
		targetTeam = await createTargetTeam(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test.describe('retention policy disabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'RetentionPolicy_Enabled', false);
		});

		test('should not show prune banner in channel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);

			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();
		});

		test('should not show prune banner in team', async () => {
			await poHomeChannel.navbar.openChat(targetTeam);

			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();
		});

		test('should not show prune section on edit channel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.roomToolbar.openRoomInfo();
			await poHomeChannel.tabs.room.btnEdit.click();

			await expect(poHomeChannel.tabs.editRoom.pruneAccordion).not.toBeVisible();
		});
	});

	test.describe('retention policy enabled', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'RetentionPolicy_Enabled', true);
		});
		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'RetentionPolicy_Enabled', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToChannels', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToGroups', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToDMs', false);
			await setSettingValueById(api, 'RetentionPolicy_TTL_Channels', timeUnitToMs(TIMEUNIT.days, 30));
		});

		test('should not show prune banner even with retention policy setting enabled in any type of room', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.navbar.openChat(targetTeam);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.navbar.openChat(targetGroup);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.navbar.openChat('user1');
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();
		});

		test('should show prune section in edit channel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await poHomeChannel.roomToolbar.openRoomInfo();
			await poHomeChannel.tabs.room.btnEdit.click();

			await expect(poHomeChannel.tabs.editRoom.pruneAccordion).toBeVisible();
		});

		test.describe('edit-room-retention-policy permission', async () => {
			let auxContext: { page: Page; poHomeChannel: HomeChannel };
			test.beforeEach(async ({ browser }) => {
				const { page } = await createAuxContext(browser, Users.user1);
				auxContext = { page, poHomeChannel: new HomeChannel(page) };
				await auxContext.poHomeChannel.navbar.openChat(targetChannel);
				await auxContext.poHomeChannel.roomToolbar.openRoomInfo();
				await auxContext.poHomeChannel.tabs.room.btnEdit.click();
			});
			test.afterEach(async () => {
				await auxContext.page.close();
			});
			test('should not show prune section in edit channel for users without permission', async () => {
				await expect(poHomeChannel.tabs.editRoom.pruneAccordion).not.toBeVisible();
			});

			test('users without permission should be able to edit the channel', async () => {
				await auxContext.poHomeChannel.tabs.editRoom.advancedSettingsAccordion.click();
				await auxContext.poHomeChannel.tabs.editRoom.checkboxReadOnly.check();
				await auxContext.poHomeChannel.tabs.editRoom.btnSave.click();

				await expect(auxContext.poHomeChannel.content.getSystemMessageByText('set room to read only')).toBeVisible();
			});
		});

		test.describe('retention policy applies enabled by default', () => {
			test.beforeAll(async ({ api }) => {
				await setSettingValueById(api, 'RetentionPolicy_AppliesToChannels', true);
				await setSettingValueById(api, 'RetentionPolicy_AppliesToGroups', true);
				await setSettingValueById(api, 'RetentionPolicy_AppliesToDMs', true);
			});

			test('should prune old messages checkbox enabled by default in channel and show retention policy banner', async () => {
				await poHomeChannel.navbar.openChat(targetChannel);
				await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();

				await poHomeChannel.roomToolbar.openRoomInfo();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.editRoom.pruneAccordion.click();
				await expect(poHomeChannel.tabs.editRoom.checkboxPruneMessages).toBeChecked();
			});

			test('should prune old messages checkbox enabled by default in team and show retention policy banner', async ({ page }) => {
				const poHomeTeam = new HomeTeam(page);
				await poHomeTeam.navbar.openChat(targetTeam);
				await expect(poHomeTeam.content.channelRetentionPolicyWarning).toBeVisible();

				await poHomeTeam.headerToolbar.openTeamInfo();
				await poHomeTeam.tabs.room.btnEdit.click();
				await poHomeTeam.tabs.editRoom.pruneAccordion.click();
				await expect(poHomeTeam.tabs.editRoom.checkboxPruneMessages).toBeChecked();
			});

			test('should prune old messages checkbox enabled by default in group and show retention policy banner', async () => {
				await poHomeChannel.navbar.openChat(targetGroup);
				await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();

				await poHomeChannel.roomToolbar.openRoomInfo();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.editRoom.pruneAccordion.click();
				await expect(poHomeChannel.tabs.editRoom.checkboxPruneMessages).toBeChecked();
			});

			test('should show retention policy banner in DMs', async () => {
				await poHomeChannel.navbar.openChat('user1');
				await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();
			});
		});

		test.describe('retention policy override', () => {
			let ignoreThreadsSetting: boolean;

			test.beforeAll(async ({ api }) => {
				ignoreThreadsSetting = (await getSettingValueById(api, 'RetentionPolicy_DoNotPruneThreads')) as boolean;
				expect((await setSettingValueById(api, 'RetentionPolicy_TTL_Channels', timeUnitToMs(TIMEUNIT.days, 15))).status()).toBe(200);
			});

			test.beforeEach(async () => {
				await poHomeChannel.navbar.openChat(targetChannel);
				await poHomeChannel.roomToolbar.openRoomInfo();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.editRoom.pruneAccordion.click();
			});

			test('should display the default max age in edit channel', async () => {
				await poHomeChannel.tabs.editRoom.checkboxOverrideGlobalRetention.click();

				await expect(poHomeChannel.tabs.editRoom.getMaxAgeLabel('15')).toBeVisible();
			});

			test('should display overridden retention max age value', async () => {
				await poHomeChannel.tabs.editRoom.checkboxOverrideGlobalRetention.click();
				await poHomeChannel.tabs.editRoom.inputRetentionMaxAge.fill('365');
				await poHomeChannel.tabs.editRoom.btnSave.click();
				await poHomeChannel.toastMessage.dismissToast();

				await poHomeChannel.roomToolbar.openRoomInfo();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.editRoom.pruneAccordion.click();

				await expect(poHomeChannel.tabs.editRoom.getMaxAgeLabel('15')).toBeVisible();
				await expect(poHomeChannel.tabs.editRoom.inputRetentionMaxAge).toHaveValue('365');
			});

			test('should ignore threads be checked accordingly with the global default value', async () => {
				await expect(poHomeChannel.tabs.editRoom.checkboxIgnoreThreads).toBeChecked({ checked: ignoreThreadsSetting });
			});

			test('should override ignore threads default value', async () => {
				await poHomeChannel.tabs.editRoom.checkboxIgnoreThreads.click();
				await poHomeChannel.tabs.editRoom.btnSave.click();
				await poHomeChannel.toastMessage.dismissToast();

				await poHomeChannel.roomToolbar.openRoomInfo();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.editRoom.pruneAccordion.click();

				await expect(poHomeChannel.tabs.editRoom.checkboxIgnoreThreads).toBeChecked({ checked: !ignoreThreadsSetting });
			});
		});
	});
});
