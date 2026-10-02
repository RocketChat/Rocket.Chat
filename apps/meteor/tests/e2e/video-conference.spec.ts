import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import {
	createArchivedChannel,
	createTargetChannel,
	createTargetChannelAndReturnFullRoom,
	setUserPreferences,
	createTargetTeam,
	createDirectMessage,
	deleteChannel,
	deleteTeam,
	setSettingValueById,
	updatePermissions,
} from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('video conference', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetReadOnlyChannel: string;
	let targetArchivedChannel: string;
	let targetTeam: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		targetReadOnlyChannel = await createTargetChannel(api, { readOnly: true });
		targetArchivedChannel = await createArchivedChannel(api);
		targetTeam = await createTargetTeam(api);
		await createDirectMessage(api);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteChannel(api, targetChannel),
			deleteChannel(api, targetArchivedChannel),
			deleteChannel(api, targetReadOnlyChannel),
			deleteTeam(api, targetTeam),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await poHomeChannel.goto();
	});

	test('should create video conference in targetChannel using keyboard', async ({ page }) => {
		await poHomeChannel.navbar.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello video conference');
		await poHomeChannel.getRoomHeaderFavoriteBtn(IS_EE).focus();
		await expect(poHomeChannel.getRoomHeaderFavoriteBtn(IS_EE)).toBeFocused();

		await test.step('opens video conference popup', async () => {
			await page.keyboard.press('Tab');
			await page.keyboard.press('Tab');
			await page.keyboard.press('Space');

			await expect(poHomeChannel.content.getVideoConfPopup(`Start a call in ${targetChannel}`)).toBeVisible();
			await expect(poHomeChannel.content.btnVideoConfMic).toBeFocused();
		});

		await test.step('dispatch start call button', async () => {
			await page.keyboard.press('Tab');
			await page.keyboard.press('Space');
		});

		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('video conference message block', async () => {
		test.use({ storageState: Users.admin.state });

		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, { displayAvatars: false });
		});

		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, { displayAvatars: true });
		});

		test('should NOT render avatars in video conference message block', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);

			await expect(poHomeChannel.content.videoConfMessageBlock.last().getByRole('figure')).toHaveCount(0);
		});
	});

	test.describe('verify if user2 received a invite call in targetChannel', async () => {
		test.use({ storageState: Users.user2.state });
		test('should display a message block in a targetChannel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should create video conference in a direct room', async () => {
		await poHomeChannel.navbar.openChat('user2');

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if user received from a direct', async () => {
		test.use({ storageState: Users.user2.state });
		test('verify if user received a call invite in direct', async () => {
			await poHomeChannel.navbar.openChat('user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should create video conference in targetTeam', async () => {
		await poHomeChannel.navbar.openChat(targetTeam);

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('verify if user2 received from a targetTeam', async () => {
		test.use({ storageState: Users.user2.state });
		test('should display a message block in a targetTeam', async () => {
			await poHomeChannel.navbar.openChat(targetTeam);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should create video conference in a direct multiple', async () => {
		await poHomeChannel.navbar.openChat('rocketchat.internal.admin.test, user2');

		await poHomeChannel.content.btnVideoCall.click();
		await poHomeChannel.content.btnStartVideoCall.click();
		await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
	});

	test.describe('received in a direct multiple', async () => {
		test.use({ storageState: Users.user2.state });
		test('should display a message block in a direct multiple', async () => {
			await poHomeChannel.navbar.openChat('rocketchat.internal.admin.test, user1');
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
		});
	});

	test('should NOT create video conference in a targetReadOnlyChannel', async () => {
		await poHomeChannel.navbar.openChat(targetReadOnlyChannel);

		await expect(poHomeChannel.content.btnVideoCall).toBeDisabled();
	});

	test('should NOT be able to create video conference in targetArchivedChannel', async () => {
		await poHomeChannel.navbar.openChat(targetArchivedChannel);

		await expect(poHomeChannel.content.btnVideoCall).toBeDisabled();
	});
});

test.describe('video conference - join button visibility', () => {
	test.skip(!IS_EE, 'Premium Only');

	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api, { members: ['user2'] });
		targetChannel = channel.name as string;

		await api.post('/video-conference.start', { roomId: channel._id });
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			deleteChannel(api, targetChannel),
			setSettingValueById(api, 'Accounts_AllowAnonymousRead', false),
			updatePermissions(api, [
				{ _id: 'call-management', roles: ['admin', 'owner', 'moderator', 'user'] },
				{ _id: 'videoconf-access', roles: ['admin', 'owner', 'moderator', 'user'] },
			]),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.describe('user without call-management or videoconf-access permission', () => {
		test.use({ storageState: Users.user2.state });

		test.beforeAll(async ({ api }) => {
			await updatePermissions(api, [
				{ _id: 'call-management', roles: ['admin', 'owner', 'moderator'] },
				{ _id: 'videoconf-access', roles: ['admin', 'owner', 'moderator'] },
			]);
		});

		test('should hide the Join button in the message block and the Calls panel when Accounts_AllowAnonymousRead is disabled', async ({
			api,
		}) => {
			await setSettingValueById(api, 'Accounts_AllowAnonymousRead', false);

			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toHaveText(/You're unable to join/i);
			await expect(poHomeChannel.content.btnJoinVideoConfMessageBlock).toBeHidden();

			await poHomeChannel.roomToolbar.openCalls();
			await expect(poHomeChannel.tabs.videoconfCalls.content).toBeVisible();
			await expect(poHomeChannel.tabs.videoconfCalls.content).toHaveText(/You're unable to join/i);
			await expect(poHomeChannel.tabs.videoconfCalls.btnJoinCall).toBeHidden();
		});

		// Anonymous access is the one way into a conference that does not pass the permission, and the client
		// offers it to whoever is looking. See [video conferences](../../../docs/features/video-conference.md).
		test('should show the Join button in the message block and the Calls panel when Accounts_AllowAnonymousRead is enabled', async ({
			api,
		}) => {
			await setSettingValueById(api, 'Accounts_AllowAnonymousRead', true);

			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.btnJoinVideoConfMessageBlock).toBeVisible();

			await poHomeChannel.roomToolbar.openCalls();
			await expect(poHomeChannel.tabs.videoconfCalls.btnJoinCall).toBeVisible();
		});
	});

	// `videoconf-access` comes before `call-management`: managing calls in a room is not a way into one.
	test.describe('user with the call-management permission and without videoconf-access', () => {
		test.use({ storageState: Users.user2.state });

		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_AllowAnonymousRead', false);
			await updatePermissions(api, [
				{ _id: 'call-management', roles: ['admin', 'owner', 'moderator', 'user'] },
				{ _id: 'videoconf-access', roles: ['admin', 'owner', 'moderator'] },
			]);
		});

		test('should hide the Join button in the message block and the Calls panel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
			await expect(poHomeChannel.content.btnJoinVideoConfMessageBlock).toBeHidden();

			await poHomeChannel.roomToolbar.openCalls();
			await expect(poHomeChannel.tabs.videoconfCalls.content).toBeVisible();
			await expect(poHomeChannel.tabs.videoconfCalls.btnJoinCall).toBeHidden();
		});

		test('should hide the Video call action from the room toolbar', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);

			await expect(poHomeChannel.content.btnVideoCall).toBeHidden();
		});
	});

	test.describe('user with videoconf-access and without call-management permission', () => {
		test.use({ storageState: Users.user2.state });

		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_AllowAnonymousRead', false);
			await updatePermissions(api, [
				{ _id: 'call-management', roles: ['admin', 'owner', 'moderator'] },
				{ _id: 'videoconf-access', roles: ['admin', 'owner', 'moderator', 'user'] },
			]);
		});

		test('should show the Join button in the message block and the Calls panel', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.btnJoinVideoConfMessageBlock).toBeVisible();

			await poHomeChannel.roomToolbar.openCalls();
			await expect(poHomeChannel.tabs.videoconfCalls.btnJoinCall).toBeVisible();
		});

		// Joining is not starting: opening a conference still asks for `call-management` as it always did.
		test('should hide the Video call action from the room toolbar', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);

			await expect(poHomeChannel.content.btnVideoCall).toBeHidden();
		});
	});

	test.describe('user with both permissions', () => {
		test.use({ storageState: Users.user2.state });

		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'Accounts_AllowAnonymousRead', false);
			await updatePermissions(api, [
				{ _id: 'call-management', roles: ['admin', 'owner', 'moderator', 'user'] },
				{ _id: 'videoconf-access', roles: ['admin', 'owner', 'moderator', 'user'] },
			]);
		});

		test('should show the Join button and the Video call action', async () => {
			await poHomeChannel.navbar.openChat(targetChannel);
			await expect(poHomeChannel.content.btnJoinVideoConfMessageBlock).toBeVisible();
			await expect(poHomeChannel.content.btnVideoCall).toBeVisible();
		});
	});

	// The permission is workspace-wide or nothing: granting it to a room role must not reach the owner of a room.
	test.describe('user who owns a room, with videoconf-access granted to owners only', () => {
		test.use({ storageState: Users.user2.state });

		let ownedChannel: string;

		test.beforeAll(async ({ api }) => {
			const { channel } = await createTargetChannelAndReturnFullRoom(api, { members: ['user2'] });
			ownedChannel = channel.name as string;

			await api.post('/channels.addOwner', { roomId: channel._id, userId: Users.user2.data._id });
			await api.post('/video-conference.start', { roomId: channel._id });

			await setSettingValueById(api, 'Accounts_AllowAnonymousRead', false);
			await updatePermissions(api, [
				{ _id: 'call-management', roles: ['admin', 'owner', 'moderator', 'user'] },
				{ _id: 'videoconf-access', roles: ['admin', 'owner', 'moderator'] },
			]);
		});

		test.afterAll(async ({ api }) => {
			await deleteChannel(api, ownedChannel);
		});

		test('should still hide the Join button and the Video call action in the room they own', async () => {
			await poHomeChannel.navbar.openChat(ownedChannel);
			await expect(poHomeChannel.content.videoConfMessageBlock.last()).toBeVisible();
			await expect(poHomeChannel.content.btnJoinVideoConfMessageBlock).toBeHidden();
			await expect(poHomeChannel.content.btnVideoCall).toBeHidden();
		});
	});
});
