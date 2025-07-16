import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeTeam } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('teams-management', () => {
	let poHomeTeam: HomeTeam;
	let targetChannel: string;
	const targetTeam = faker.string.uuid();
	const targetTeamNonPrivate = faker.string.uuid();
	const targetTeamReadOnly = faker.string.uuid();
	const targetGroupNameInTeam = faker.string.uuid();
	const targetChannelNameInTeam = faker.string.uuid();

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.afterAll(async ({ api }) => {
		await api.post('/permissions.update', {
			permissions: [
				{ _id: 'move-room-to-team', roles: ['admin', 'owner', 'moderator'] },
				{ _id: 'create-team-channel', roles: ['admin', 'owner', 'moderator'] },
				{ _id: 'create-team-group', roles: ['admin', 'owner', 'moderator'] },
				{ _id: 'delete-team-channel', roles: ['admin', 'owner', 'moderator'] },
				{ _id: 'delete-team-group', roles: ['admin', 'owner', 'moderator'] },
			],
		});
	});

	test.beforeEach(async ({ page }) => {
		poHomeTeam = new HomeTeam(page);

		await page.goto('/home');
	});

	test('should create targetTeam private', async ({ page }) => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.fill(targetTeam);
		await poHomeTeam.addMember('user1');
		await poHomeTeam.btnTeamCreate.click();

		await expect(page).toHaveURL(`/group/${targetTeam}`);
	});

	test('should create targetTeamNonPrivate non private', async ({ page }) => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.fill(targetTeamNonPrivate);
		await poHomeTeam.textPrivate.click();
		await poHomeTeam.addMember('user1');
		await poHomeTeam.btnTeamCreate.click();

		await expect(page).toHaveURL(`/channel/${targetTeamNonPrivate}`);
	});

	test('should create targetTeamReadOnly readonly', async ({ page }) => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.fill(targetTeamReadOnly);
		await poHomeTeam.sidenav.advancedSettingsAccordion.click();
		await poHomeTeam.textReadOnly.click();
		await poHomeTeam.addMember('user1');
		await poHomeTeam.btnTeamCreate.click();

		await expect(page).toHaveURL(`/group/${targetTeamReadOnly}`);
	});

	test('should throw validation error if team name already exists', async () => {
		await poHomeTeam.sidenav.openNewByLabel('Team');
		await poHomeTeam.inputTeamName.fill(targetTeam);
		await poHomeTeam.btnTeamCreate.click();

		await expect(poHomeTeam.inputTeamName).toHaveAttribute('aria-invalid', 'true');
	});

	test('should send hello in the targetTeam and reply in a thread', async ({ page }) => {
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.content.sendMessage('hello');
		await page.locator('[data-qa-type="message"]').last().hover();

		await page.locator('role=button[name="Reply in thread"]').click();
		await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetTeam}"]`).type('any-reply-message');
		await page.keyboard.press('Enter');
		await expect(poHomeTeam.tabs.flexTabViewThreadMessage).toHaveText('any-reply-message');
	});

	test('should set targetTeam as readonly', async () => {
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnRoomInfo.click();
		await poHomeTeam.tabs.room.btnEdit.click();
		await poHomeTeam.tabs.room.advancedSettingsAccordion.click();
		await poHomeTeam.tabs.room.checkboxReadOnly.click();
		await poHomeTeam.tabs.room.btnSave.click();

		await expect(poHomeTeam.content.getSystemMessageByText('set room to read only')).toBeVisible();
	});

	test('should not allow moving room to team if move-room-to-team permission has not been granted', async ({ api }) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'move-room-to-team', roles: ['moderator'] }] })).status()).toBe(
			200,
		);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await expect(poHomeTeam.tabs.channels.btnAddExisting).not.toBeVisible();
	});

	test('should not allow creating a room in a team if both create-team-channel and create-team-group permissions have not been granted', async ({
		api,
	}) => {
		expect(
			(
				await api.post('/permissions.update', {
					permissions: [
						{ _id: 'create-team-channel', roles: ['moderator'] },
						{ _id: 'create-team-group', roles: ['moderator'] },
					],
				})
			).status(),
		).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await expect(poHomeTeam.tabs.channels.btnCreateNew).not.toBeVisible();
	});

	test('should allow creating a channel in a team if user has the create-team-channel permission, but not the create-team-group permission', async ({
		api,
	}) => {
		expect(
			(
				await api.post('/permissions.update', {
					permissions: [
						{ _id: 'create-team-channel', roles: ['admin'] },
						{ _id: 'create-team-group', roles: ['moderator'] },
					],
				})
			).status(),
		).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await expect(poHomeTeam.tabs.channels.btnCreateNew).toBeVisible();
		await poHomeTeam.tabs.channels.btnCreateNew.click();
		await poHomeTeam.sidenav.inputChannelName.type(targetChannelNameInTeam);
		await expect(poHomeTeam.sidenav.checkboxPrivateChannel).not.toBeChecked();
		await expect(poHomeTeam.sidenav.checkboxPrivateChannel).toBeDisabled();
		await poHomeTeam.sidenav.btnCreate.click();

		await expect(poHomeTeam.tabs.channels.channelsList).toContainText(targetChannelNameInTeam);
	});

	test('should allow creating a group in a team if user has the create-team-group permission, but not the create-team-channel permission', async ({
		api,
	}) => {
		expect(
			(
				await api.post('/permissions.update', {
					permissions: [
						{ _id: 'create-team-group', roles: ['admin'] },
						{ _id: 'create-team-channel', roles: ['moderator'] },
					],
				})
			).status(),
		).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await expect(poHomeTeam.tabs.channels.btnCreateNew).toBeVisible();
		await poHomeTeam.tabs.channels.btnCreateNew.click();
		await poHomeTeam.sidenav.inputChannelName.type(targetGroupNameInTeam);
		await expect(poHomeTeam.sidenav.checkboxPrivateChannel).toBeChecked();
		await expect(poHomeTeam.sidenav.checkboxPrivateChannel).toBeDisabled();
		await poHomeTeam.sidenav.btnCreate.click();

		await expect(poHomeTeam.tabs.channels.channelsList).toContainText(targetGroupNameInTeam);
	});

	test('should move targetChannel to targetTeam', async ({ page, api }) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'move-room-to-team', roles: ['owner'] }] })).status()).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.btnAddExisting.click();
		await poHomeTeam.tabs.channels.inputChannels.fill(targetChannel);
		await page.locator(`.rcx-option__content:has-text("${targetChannel}")`).click();
		await poHomeTeam.tabs.channels.btnAdd.click();

		await expect(poHomeTeam.tabs.channels.channelsList).toContainText(targetChannel);
	});

	test('should access team channel through targetTeam header', async ({ page }) => {
		await poHomeTeam.sidenav.openChat(targetChannel);
		await page.getByRole('button', { name: targetChannel }).first().focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Space');

		await expect(page).toHaveURL(`/group/${targetTeam}`);
	});

	test('should not allow removing a targetGroup from targetTeam if user does not have the remove-team-channel permission', async ({
		page,
		api,
	}) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'remove-team-channel', roles: ['moderator'] }] })).status()).toBe(
			200,
		);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetGroupNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Remove from team' })).not.toBeVisible();
	});

	test('should allow removing a targetGroup from targetTeam if user has the remove-team-channel permission', async ({ page, api }) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'remove-team-channel', roles: ['owner'] }] })).status()).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetGroupNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Remove from team' })).toBeVisible();
		await page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Remove from team' }).click();
		await poHomeTeam.tabs.channels.confirmRemoveChannel();

		await expect(poHomeTeam.tabs.channels.channelsList).not.toContainText(targetGroupNameInTeam);
	});

	test('should not allow deleting a targetGroup from targetTeam if the group owner does not have the delete-team-group permission', async ({
		page,
		api,
	}) => {
		expect(
			(
				await api.post('/permissions.update', {
					permissions: [
						{ _id: 'delete-team-group', roles: ['moderator'] },
						{ _id: 'move-room-to-team', roles: ['owner'] },
					],
				})
			).status(),
		).toBe(200);

		// re-add channel to team
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.btnAddExisting.click();
		await poHomeTeam.tabs.channels.inputChannels.fill(targetGroupNameInTeam);
		await page.locator(`.rcx-option__content:has-text("${targetGroupNameInTeam}")`).click();
		await poHomeTeam.tabs.channels.btnAdd.click();
		await expect(poHomeTeam.tabs.channels.channelsList).toContainText(targetGroupNameInTeam);

		// try to delete group in team
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetGroupNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Delete' })).not.toBeVisible();
	});

	test('should allow deleting a targetGroup from targetTeam if the group owner also has the delete-team-group permission', async ({
		page,
		api,
	}) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'delete-team-group', roles: ['owner'] }] })).status()).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetGroupNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Delete' })).toBeVisible();
		await page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Delete' }).click();
		await poHomeTeam.tabs.channels.confirmDeleteRoom();

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await expect(poHomeTeam.tabs.channels.channelsList).not.toContainText(targetGroupNameInTeam);
	});

	test('should not allow removing a targetChannel from targetTeam if user does not have the remove-team-channel permission', async ({
		page,
		api,
	}) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'remove-team-channel', roles: ['moderator'] }] })).status()).toBe(
			200,
		);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetChannelNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Remove from team' })).not.toBeVisible();
	});

	test('should allow removing a targetChannel from targetTeam if user has the remove-team-channel permission', async ({ page, api }) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'remove-team-channel', roles: ['owner'] }] })).status()).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetChannelNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Remove from team' })).toBeVisible();
		await page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Remove from team' }).click();
		await poHomeTeam.tabs.channels.confirmRemoveChannel();

		await expect(poHomeTeam.tabs.channels.channelsList).not.toContainText(targetChannelNameInTeam);
	});

	test('should not allow deleting a targetChannel from targetTeam if the channel owner does not have the delete-team-channel permission', async ({
		page,
		api,
	}) => {
		expect(
			(
				await api.post('/permissions.update', {
					permissions: [
						{ _id: 'delete-team-channel', roles: ['moderator'] },
						{ _id: 'move-room-to-team', roles: ['owner'] },
					],
				})
			).status(),
		).toBe(200);

		// re-add channel to team
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.btnAddExisting.click();
		await poHomeTeam.tabs.channels.inputChannels.fill(targetChannelNameInTeam);
		await page.locator(`.rcx-option__content:has-text("${targetChannelNameInTeam}")`).click();
		await poHomeTeam.tabs.channels.btnAdd.click();
		await expect(poHomeTeam.tabs.channels.channelsList).toContainText(targetChannelNameInTeam);

		// try to delete channel in team
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetChannelNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Delete' })).not.toBeVisible();
	});

	test('should allow deleting a targetChannel from targetTeam if the channel owner also has the delete-team-channel permission', async ({
		page,
		api,
	}) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'delete-team-channel', roles: ['owner'] }] })).status()).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetChannelNameInTeam);
		await expect(page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Delete' })).toBeVisible();
		await page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Delete' }).click();
		await poHomeTeam.tabs.channels.confirmDeleteRoom();

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await expect(poHomeTeam.tabs.channels.channelsList).not.toContainText(targetChannelNameInTeam);
	});

	test('should remove targetChannel from targetTeam', async ({ page, api }) => {
		expect((await api.post('/permissions.update', { permissions: [{ _id: 'remove-team-channel', roles: ['owner'] }] })).status()).toBe(200);

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnChannels.click();
		await poHomeTeam.tabs.channels.openChannelOptionMoreActions(targetChannel);
		await page.getByRole('menu', { exact: true }).getByRole('menuitem', { name: 'Remove from team' }).click();
		await poHomeTeam.tabs.channels.confirmRemoveChannel();

		await expect(poHomeTeam.tabs.channels.channelsList).not.toBeVisible();
	});

	test('should remove user1 from targetTeamNonPrivate', async () => {
		await poHomeTeam.sidenav.openChat(targetTeamNonPrivate);
		await poHomeTeam.tabs.kebab.click({ force: true });
		await poHomeTeam.tabs.btnTeamMembers.click();
		await poHomeTeam.tabs.members.showAllUsers();
		await poHomeTeam.tabs.members.openMemberOptionMoreActions('user1');
		await poHomeTeam.tabs.members.getMenuItemAction('Remove from team').click();
		await expect(poHomeTeam.tabs.members.confirmRemoveUserModal).toBeVisible();

		await poHomeTeam.tabs.members.confirmRemoveUser();
		await expect(poHomeTeam.tabs.members.memberOption('user1')).not.toBeVisible();
	});

	test('should delete targetTeamNonPrivate', async () => {
		await poHomeTeam.sidenav.openChat(targetTeamNonPrivate);
		await poHomeTeam.tabs.btnRoomInfo.click();
		await poHomeTeam.tabs.room.btnMore.click();
		await poHomeTeam.tabs.room.getMoreOption('Delete').click();
		await expect(poHomeTeam.tabs.room.confirmDeleteTeamModal).toBeVisible();

		await poHomeTeam.tabs.room.confirmDeleteTeam();
		await poHomeTeam.sidenav.searchRoom(targetTeamNonPrivate);
		await expect(poHomeTeam.sidenav.getSearchItemByName(targetTeamNonPrivate)).not.toBeVisible();
	});

	test('should user1 leave from targetTeam', async ({ browser }) => {
		const user1Page = await browser.newPage({ storageState: Users.user1.state });
		const user1Channel = new HomeTeam(user1Page);
		await user1Page.goto(`/group/${targetTeam}`);
		await user1Channel.content.waitForChannel();

		await user1Channel.tabs.btnRoomInfo.click();
		await user1Channel.tabs.room.btnLeave.click();
		await expect(user1Channel.tabs.room.confirmLeaveModal).toBeVisible();

		await user1Channel.tabs.room.confirmLeave();
		await user1Page.close();

		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.kebab.click({ force: true });
		await poHomeTeam.tabs.btnTeamMembers.click();
		await poHomeTeam.tabs.members.showAllUsers();
		await expect(poHomeTeam.tabs.members.memberOption('user1')).not.toBeVisible();
	});

	test('should convert team into a channel', async () => {
		await poHomeTeam.sidenav.openChat(targetTeam);
		await poHomeTeam.tabs.btnRoomInfo.click();
		await poHomeTeam.tabs.room.btnMore.click();
		await poHomeTeam.tabs.room.getMoreOption('Convert to Channel').click();
		await expect(poHomeTeam.tabs.room.confirmConvertModal).toBeVisible();

		await poHomeTeam.tabs.room.confirmConvert();

		// TODO: improve this locator and check the action reactivity
		await expect(poHomeTeam.content.getSystemMessageByText(`converted #${targetTeam} to channel`)).toBeVisible();
	});
});
