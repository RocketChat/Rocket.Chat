import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('channel-management', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should navigate on toolbar using arrow keys', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello composer');
		await poHomeChannel.roomHeaderFavoriteBtn.focus();

		await page.keyboard.press('Tab');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');

		await expect(poHomeChannel.roomHeaderToolbar.getByRole('button', { name: 'Threads' })).toBeFocused();
	});

	test('should move the focus away from toolbar using tab key', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.roomHeaderFavoriteBtn.focus();

		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		await expect(poHomeChannel.roomHeaderToolbar.getByRole('button', { name: 'Call' })).not.toBeFocused();
	});

	test('should be able to navigate on call popup with keyboard', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.roomHeaderFavoriteBtn.focus();

		await page.keyboard.press('Tab');
		await page.keyboard.press('Space');
		await poHomeChannel.content.btnStartCall.waitFor();
		await page.keyboard.press('Tab');

		await expect(page.getByRole('button', { name: 'Start call' })).toBeFocused();
	});

	test('expect add "user1" to "targetChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnTabMembers.click();
		await poHomeChannel.tabs.members.showAllUsers();
		await poHomeChannel.tabs.members.addUser('user1');

		await expect(poHomeChannel.toastSuccess).toBeVisible();
	});

	test('expect create invite to the room', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnTabMembers.click();
		await poHomeChannel.tabs.members.inviteUser();

		await expect(poHomeChannel.toastSuccess).toBeVisible();
	});

	test('expect mute "user1"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnTabMembers.click();
		await poHomeChannel.tabs.members.showAllUsers();
		await poHomeChannel.tabs.members.muteUser('user1');
	});

	test('expect set "user1" as owner', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnTabMembers.click();
		await poHomeChannel.tabs.members.showAllUsers();
		await poHomeChannel.tabs.members.setUserAsOwner('user1');
	});

	test('expect set "user1" as moderator', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnTabMembers.click();
		await poHomeChannel.tabs.members.showAllUsers();
		await poHomeChannel.tabs.members.setUserAsModerator('user1');
	});

	test('expect edit topic of "targetChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputTopic.fill('hello-topic-edited');
		await poHomeChannel.tabs.room.btnSave.click();
	});

	test('expect edit announcement of "targetChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputAnnouncement.fill('hello-announcement-edited');
		await poHomeChannel.tabs.room.btnSave.click();
	});

	test('expect edit description of "targetChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputDescription.fill('hello-description-edited');
		await poHomeChannel.tabs.room.btnSave.click();
	});

	test('expect edit name of "targetChannel"', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputName.fill(`NAME-EDITED-${targetChannel}`);
		await poHomeChannel.tabs.room.btnSave.click();
		await poHomeChannel.sidenav.openChat(`NAME-EDITED-${targetChannel}`);

		await expect(page).toHaveURL(`/channel/NAME-EDITED-${targetChannel}`);
	});

	test.skip('expect edit notification preferences of "targetChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnNotificationPreferences.click({ force: true });
		await poHomeChannel.tabs.notificationPreferences.updateAllNotificationPreferences();
		await poHomeChannel.tabs.notificationPreferences.btnSave.click();

		await expect(poHomeChannel.toastSuccess).toBeVisible();
	});

	let regularUserPage: Page;
	test('expect "readOnlyChannel" to show join button', async ({ browser }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.inputChannelName.type(channelName);
		await poHomeChannel.sidenav.checkboxPrivateChannel.click();
		await poHomeChannel.sidenav.checkboxReadOnly.click();
		await poHomeChannel.sidenav.btnCreate.click();

		regularUserPage = await browser.newPage({ storageState: Users.user2.state });

		const channel = new HomeChannel(regularUserPage);

		await regularUserPage.goto(`/channel/${channelName}`);
		await channel.waitForChannel();
		await expect(regularUserPage.locator('button >> text="Join"')).toBeVisible();

		await regularUserPage.close();
	});

	test.skip('expect all notification preferences of "targetChannel" to be "Mentions"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnNotificationPreferences.click({ force: true });

		await expect(poHomeChannel.tabs.notificationPreferences.getPreferenceByDevice('Desktop')).toContainText('Mentions');
		await expect(poHomeChannel.tabs.notificationPreferences.getPreferenceByDevice('Mobile')).toContainText('Mentions');
		await expect(poHomeChannel.tabs.notificationPreferences.getPreferenceByDevice('Email')).toContainText('Mentions');
	});
});
