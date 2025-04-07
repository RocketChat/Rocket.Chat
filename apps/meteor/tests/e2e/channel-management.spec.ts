import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('channel-management', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let discussionName: string;

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

		await expect(poHomeChannel.roomHeaderToolbar.getByRole('button', { name: 'Threads', exact: true })).toBeFocused();
	});

	test('should move the focus away from toolbar using tab key', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.roomHeaderFavoriteBtn.focus();

		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		await expect(poHomeChannel.roomHeaderToolbar.getByRole('button', { name: 'Call' })).not.toBeFocused();
	});

	test('should be able to navigate on call popup with keyboard', async ({ page }) => {
		test.skip(!IS_EE, 'Premium Only');
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.roomHeaderFavoriteBtn.focus();

		await page.keyboard.press('Tab');
		await page.keyboard.press('Space');
		await page.keyboard.press('Space');
		await poHomeChannel.content.btnStartVideoCall.waitFor();
		await page.keyboard.press('Tab');

		await expect(page.getByRole('button', { name: 'Start call' })).toBeFocused();
	});

	test('should add user1 to targetChannel', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnTabMembers.click();
		await poHomeChannel.tabs.members.showAllUsers();
		await poHomeChannel.tabs.members.addUser('user1');

		await expect(poHomeChannel.tabs.members.memberOption('user1')).toBeVisible();
		await expect(poHomeChannel.content.getSystemMessageByText('added user1')).toBeVisible();
	});

	test('should edit topic of targetChannel', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputTopic.fill('hello-topic-edited');
		await poHomeChannel.tabs.room.btnSave.click();

		await poHomeChannel.dismissToast();
		await poHomeChannel.tabs.btnRoomInfo.click();
		await expect(page.getByRole('heading', { name: 'hello-topic-edited' })).toBeVisible();
		await expect(page.getByRole('dialog', { name: 'Channel info' })).toContainText('hello-topic-edited');
		await expect(poHomeChannel.content.getSystemMessageByText('changed room topic to hello-topic-edited')).toBeVisible();
	});

	test('should edit announcement of targetChannel', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputAnnouncement.fill('hello-announcement-edited');
		await poHomeChannel.tabs.room.btnSave.click();

		await poHomeChannel.dismissToast();
		await poHomeChannel.tabs.btnRoomInfo.click();
		await expect(page.getByRole('dialog', { name: 'Channel info' })).toContainText('hello-announcement-edited');
		await expect(poHomeChannel.content.getSystemMessageByText('changed room announcement to: hello-announcement-edited')).toBeVisible();
	});

	test('should edit description of targetChannel', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputDescription.fill('hello-description-edited');
		await poHomeChannel.tabs.room.btnSave.click();

		await poHomeChannel.dismissToast();
		await poHomeChannel.tabs.btnRoomInfo.click();
		await expect(page.getByRole('dialog', { name: 'Channel info' })).toContainText('hello-description-edited');
		await expect(poHomeChannel.content.getSystemMessageByText('changed room description to: hello-description-edited')).toBeVisible();
	});

	test('should edit name of targetChannel', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputName.fill(`NAME-EDITED-${targetChannel}`);
		await poHomeChannel.tabs.room.btnSave.click();

		targetChannel = `NAME-EDITED-${targetChannel}`;
		await expect(page.locator(`role=main >> role=heading[name="${targetChannel}"]`)).toBeVisible();
		await poHomeChannel.sidenav.openChat(targetChannel);

		await expect(page).toHaveURL(`/channel/${targetChannel}`);
	});

	test('should truncate the room name for small screens', async ({ page }) => {
		const hugeName = faker.string.alpha(200);
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.btnRoomInfo.click();
		await poHomeChannel.tabs.room.btnEdit.click();
		await poHomeChannel.tabs.room.inputName.fill(hugeName);
		await poHomeChannel.tabs.room.btnSave.click();
		targetChannel = hugeName;

		await page.setViewportSize({ width: 640, height: 460 });
		await expect(page.getByRole('heading', { name: hugeName })).toHaveCSS('width', '407px');
	});

	test('should open sidebar clicking on sidebar toggler', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);

		await page.setViewportSize({ width: 640, height: 460 });
		await page.getByRole('button', { name: 'Open sidebar' }).click();

		await expect(page.getByRole('navigation')).toBeVisible();
	});

	test('should open room info when clicking on roomName', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await page.getByRole('button', { name: targetChannel }).first().focus();
		await page.keyboard.press('Space');
		await page.getByRole('dialog').waitFor();

		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('should create a discussion using the message composer', async ({ page }) => {
		discussionName = faker.string.uuid();
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.btnMenuMoreActions.click();
		await page.getByRole('menuitem', { name: 'Discussion' }).click();
		await poHomeChannel.content.inputDiscussionName.fill(discussionName);
		await poHomeChannel.content.btnCreateDiscussionModal.click();

		await expect(page.getByRole('heading', { name: discussionName })).toBeVisible();
	});

	test('should access targetTeam through discussion header', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await page.locator('[data-qa-type="message"]', { hasText: discussionName }).locator('button').first().click();
		await page.getByRole('button', { name: discussionName }).first().focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Space');

		await expect(page).toHaveURL(`/channel/${targetChannel}`);
	});

	test('should edit notification preferences of targetChannel', async () => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.tabs.kebab.click({ force: true });
		await poHomeChannel.tabs.btnNotificationPreferences.click({ force: true });
		await poHomeChannel.tabs.notificationPreferences.updateAllNotificationPreferences();
		await poHomeChannel.tabs.notificationPreferences.btnSave.click();

		await expect(poHomeChannel.tabs.notificationPreferences.getPreferenceByDevice('Desktop')).toContainText('Mentions');
		await expect(poHomeChannel.tabs.notificationPreferences.getPreferenceByDevice('Mobile')).toContainText('Mentions');
		await expect(poHomeChannel.tabs.notificationPreferences.getPreferenceByDevice('Email')).toContainText('Mentions');
	});

	test.describe.serial('cross user tests', () => {
		let user1Page: Page;
		test.beforeEach(async ({ browser }) => {
			user1Page = await browser.newPage({ storageState: Users.user1.state });
		});

		test.afterEach(async () => {
			await user1Page.close();
		});

		test('should mute user1', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnTabMembers.click();
			await poHomeChannel.tabs.members.showAllUsers();
			await poHomeChannel.tabs.members.muteUser('user1');

			await expect(poHomeChannel.content.getSystemMessageByText('muted user1')).toBeVisible();

			const user1Channel = new HomeChannel(user1Page);
			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await expect(user1Channel.readOnlyFooter).toBeVisible();
		});

		test('should unmuteUser user1', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnTabMembers.click();
			await poHomeChannel.tabs.members.showAllUsers();
			await poHomeChannel.tabs.members.unmuteUser('user1');

			await expect(poHomeChannel.content.getSystemMessageByText('unmuted user1')).toBeVisible();

			const user1Channel = new HomeChannel(user1Page);
			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await expect(user1Channel.composer).toBeVisible();
		});

		test('should set user1 as moderator', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnTabMembers.click();
			await poHomeChannel.tabs.members.showAllUsers();
			await poHomeChannel.tabs.members.setUserAsModerator('user1');

			await expect(poHomeChannel.content.getSystemMessageByText('set user1 as moderator')).toBeVisible();

			const user1Channel = new HomeChannel(user1Page);
			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await user1Channel.tabs.btnRoomInfo.click();
			await expect(user1Channel.tabs.room.btnEdit).toBeVisible();
		});

		test('should set user1 as owner', async ({ browser }) => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnTabMembers.click();
			await poHomeChannel.tabs.members.showAllUsers();
			await poHomeChannel.tabs.members.setUserAsOwner('user1');

			await expect(poHomeChannel.content.getSystemMessageByText('set user1 as owner')).toBeVisible();

			const user1Page = await browser.newPage({ storageState: Users.user1.state });
			const user1Channel = new HomeChannel(user1Page);
			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await user1Channel.tabs.btnRoomInfo.click();

			await user1Channel.tabs.room.btnMore.click();

			await expect(user1Channel.tabs.room.optionDelete).toBeVisible();

			await user1Page.close();
		});

		test('should ignore user1 messages', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.tabs.btnTabMembers.click();
			await poHomeChannel.tabs.members.showAllUsers();
			await poHomeChannel.tabs.members.ignoreUser('user1');

			await poHomeChannel.tabs.members.openMoreActions();
			await expect(poHomeChannel.tabs.members.getMenuItemAction('Unignore')).toBeVisible();

			const user1Channel = new HomeChannel(user1Page);
			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await user1Channel.content.sendMessage('message to check ignore');

			await expect(poHomeChannel.content.lastUserMessageBody).toContainText('This message was ignored');
		});

		test('should unignore single user1 message', async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);

			const user1Channel = new HomeChannel(user1Page);
			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await user1Channel.content.sendMessage('only message to be unignored');

			await poHomeChannel.sidenav.openChat(targetChannel);

			await expect(poHomeChannel.content.lastUserMessageBody).toContainText('This message was ignored');
			await poHomeChannel.content.lastIgnoredUserMessage.click();
			await expect(poHomeChannel.content.lastUserMessageBody).toContainText('only message to be unignored');
		});

		test('should unignore user1 messages', async () => {
			const user1Channel = new HomeChannel(user1Page);
			await user1Page.goto(`/channel/${targetChannel}`);
			await user1Channel.content.waitForChannel();
			await user1Channel.content.sendMessage('message before being unignored');

			await poHomeChannel.sidenav.openChat(targetChannel);
			await expect(poHomeChannel.content.lastUserMessageBody).toContainText('This message was ignored');

			await poHomeChannel.tabs.btnTabMembers.click();
			await poHomeChannel.tabs.members.showAllUsers();
			await poHomeChannel.tabs.members.unignoreUser('user1');

			await poHomeChannel.tabs.members.openMoreActions();
			await expect(poHomeChannel.tabs.members.getMenuItemAction('Ignore')).toBeVisible();

			await user1Channel.content.sendMessage('message after being unignored');

			await expect(poHomeChannel.content.nthMessage(-2)).toContainText('message before being unignored');
			await expect(poHomeChannel.content.lastUserMessageBody).toContainText('message after being unignored');
		});

		test('should readOnlyChannel show join button', async () => {
			const channelName = faker.string.uuid();

			await poHomeChannel.sidenav.openNewByLabel('Channel');
			await poHomeChannel.sidenav.inputChannelName.fill(channelName);
			await poHomeChannel.sidenav.checkboxPrivateChannel.click();
			await poHomeChannel.sidenav.advancedSettingsAccordion.click();
			await poHomeChannel.sidenav.checkboxReadOnly.click();
			await poHomeChannel.sidenav.btnCreate.click();

			const channel = new HomeChannel(user1Page);

			await user1Page.goto(`/channel/${channelName}`);
			await channel.content.waitForChannel();
			await expect(user1Page.locator('button >> text="Join"')).toBeVisible();
		});
	});
});
