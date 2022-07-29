import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { HomeChannel } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('channel-management', () => {
	let poHomeChannel: HomeChannel;
	const targetChannel = faker.datatype.uuid();

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect create "targetChannel" channel', async ({ page }) => {
		await poHomeChannel.sidenav.openNewByLabel('Channel');
		await poHomeChannel.sidenav.checkboxPrivateChannel.click();
		await poHomeChannel.sidenav.inputChannelName.type(targetChannel);
		await poHomeChannel.sidenav.btnCreateChannel.click();

		await expect(page).toHaveURL(`/channel/${targetChannel}`);
	});

	test('expect add "user1" to "targetChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnTabMembers.click();
		await poHomeChannel.tabs.members.showAllUsers();
		await poHomeChannel.tabs.members.addUser('user1');

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

	test('expect edit name of "targetChannel"', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputName.fill(`${targetChannel}edit`);
		await poHomeChannel.tabs.room.btnSave.click();
	});
});
