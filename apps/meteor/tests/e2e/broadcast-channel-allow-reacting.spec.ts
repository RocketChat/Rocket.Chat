import { faker } from '@faker-js/faker';
import { test, expect } from './utils/test';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';

test.use({ storageState: Users.admin.state });

test.describe.serial('broadcast-reacting', () => {
	let poHomeChannel: HomeChannel;
	let broadcastChannel: string;
	let regularChannel: string;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('should not show "React when read-only" toggle in broadcast channel', async ({ page }) => {
		broadcastChannel = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(broadcastChannel);
		await poHomeChannel.sidenav.advancedSettingsAccordion.click();
		await poHomeChannel.sidenav.checkboxReadOnly.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await poHomeChannel.roomToolbar.openRoomInfo();
		await poHomeChannel.tabs.room.btnEdit.click();

		await expect(page.getByRole('checkbox', { name: /React when read only/i })).toHaveCount(0);
	});

	test('should show "React when read-only" toggle in regular read-only channel', async ({ page }) => {
		regularChannel = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.fill(regularChannel);
		await poHomeChannel.sidenav.advancedSettingsAccordion.click();
		await poHomeChannel.sidenav.checkboxReadOnly.click();
		await poHomeChannel.sidenav.btnCreate.click();

		await poHomeChannel.roomToolbar.openRoomInfo();
		await poHomeChannel.tabs.room.btnEdit.click();

		await expect(page.getByRole('checkbox', { name: /React when read only/i })).toBeVisible();
	});
});
