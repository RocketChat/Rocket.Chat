import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { timeUnitToMs, TIMEUNIT } from '../../client/lib/convertTimeUnit';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetTeam, createTargetPrivateChannel, getSettingValueById, setSettingValueById } from './utils';
import { test, expect } from './utils/test';

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
			await poHomeChannel.sidenav.openChat(targetChannel);

			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();
		});

		test('should not show prune banner in team', async () => {
			await poHomeChannel.sidenav.openChat(targetTeam);

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
		});
		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'RetentionPolicy_Enabled', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToChannels', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToGroups', false);
			await setSettingValueById(api, 'RetentionPolicy_AppliesToDMs', false);
			await setSettingValueById(api, 'RetentionPolicy_TTL_Channels', timeUnitToMs(TIMEUNIT.days, 30));
		});

		test('should not show prune banner even with retention policy setting enabled in any type of room', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.channelRetentionPolicyWarning).not.toBeVisible();

			await poHomeChannel.sidenav.openChat(targetTeam);
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

		test.describe('edit-room-retention-policy permission', async () => {
			let auxContext: { page: Page; poHomeChannel: HomeChannel };
			test.beforeEach(async ({ browser }) => {
				const { page } = await createAuxContext(browser, Users.user1);
				auxContext = { page, poHomeChannel: new HomeChannel(page) };
				await auxContext.poHomeChannel.sidenav.openChat(targetChannel);
				await auxContext.poHomeChannel.tabs.btnRoomInfo.click();
				await auxContext.poHomeChannel.tabs.room.btnEdit.click();
			});
			test.afterEach(async () => {
				await auxContext.page.close();
			});
			test('should not show prune section in edit channel for users without permission', async () => {
				await auxContext.poHomeChannel.sidenav.openChat(targetChannel);
				await auxContext.poHomeChannel.tabs.btnRoomInfo.click();
				await auxContext.poHomeChannel.tabs.room.btnEdit.click();

				await expect(poHomeChannel.tabs.room.pruneAccordion).not.toBeVisible();
			});

			test('users without permission should be able to edit the channel', async () => {
				await auxContext.poHomeChannel.sidenav.openChat(targetChannel);
				await auxContext.poHomeChannel.tabs.btnRoomInfo.click();
				await auxContext.poHomeChannel.tabs.room.btnEdit.click();
				await auxContext.poHomeChannel.tabs.room.advancedSettingsAccordion.click();
				await auxContext.poHomeChannel.tabs.room.checkboxReadOnly.check();
				await auxContext.poHomeChannel.tabs.room.btnSave.click();

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
				await poHomeChannel.sidenav.openChat(targetChannel);
				await expect(poHomeChannel.content.channelRetentionPolicyWarning).toBeVisible();

				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();
				await expect(poHomeChannel.tabs.room.checkboxPruneMessages).toBeChecked();
			});

			test('should prune old messages checkbox enabled by default in team and show retention policy banner', async () => {
				await poHomeChannel.sidenav.openChat(targetTeam);
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
			let ignoreThreadsSetting: boolean;

			test.beforeAll(async ({ api }) => {
				ignoreThreadsSetting = (await getSettingValueById(api, 'RetentionPolicy_DoNotPruneThreads')) as boolean;
				expect((await setSettingValueById(api, 'RetentionPolicy_TTL_Channels', timeUnitToMs(TIMEUNIT.days, 15))).status()).toBe(200);
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

			test('should ignore threads be checked accordingly with the global default value', async () => {
				await poHomeChannel.sidenav.openChat(targetChannel);
				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();

				await expect(poHomeChannel.tabs.room.checkboxIgnoreThreads).toBeChecked({ checked: ignoreThreadsSetting });
			});

			test('should override ignore threads default value', async () => {
				await poHomeChannel.sidenav.openChat(targetChannel);
				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();
				await poHomeChannel.tabs.room.checkboxIgnoreThreads.click();
				await poHomeChannel.tabs.room.btnSave.click();
				await poHomeChannel.dismissToast();

				await poHomeChannel.tabs.btnRoomInfo.click();
				await poHomeChannel.tabs.room.btnEdit.click();
				await poHomeChannel.tabs.room.pruneAccordion.click();

				await expect(poHomeChannel.tabs.room.checkboxIgnoreThreads).toBeChecked({ checked: !ignoreThreadsSetting });
			});
		});
	});
});
