import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel, Utils } from './page-objects';
import { Directory } from './page-objects/directory';
import { createDirectMessage, createTargetChannel, sendTargetChannelMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe('Preview public channel', () => {
	let poHomeChannel: HomeChannel;
	let poDirectory: Directory;
	let poUtils: Utils;
	let targetChannel: string;
	let targetChannelMessage: string;

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		poDirectory = new Directory(page);
		poUtils = new Utils(page);

		await page.goto('/home');
	});

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		targetChannelMessage = await sendTargetChannelMessage(api, targetChannel, { msg: 'This message' });

		await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/channels.delete', { roomName: targetChannel });
		await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
	});

	test.describe('User', () => {
		test.use({ storageState: Users.user1.state });

		test('should let user preview public rooms messages', async () => {
			await poHomeChannel.sidenav.openDirectory();
			await poDirectory.openChannel(targetChannel);

			await expect(poHomeChannel.content.lastUserMessageBody).toContainText(targetChannelMessage);
		});

		test('should let user view direct rooms', async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin'] }] });
			await createDirectMessage(api);

			await poHomeChannel.sidenav.openChat(Users.user2.data.username);

			await expect(poHomeChannel.content.btnJoinChannel).not.toBeVisible();
			await expect(poHomeChannel.composer).toBeEnabled();
		});

		test('should not let user role preview public rooms', async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin'] }] });

			await poHomeChannel.sidenav.openDirectory();
			await poDirectory.openChannel(targetChannel);

			await expect(poHomeChannel.content.btnJoinChannel).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessageBody).not.toBeVisible();
		});
	});

	test.describe('App', () => {
		test.skip(!IS_EE, 'Premium Only');
		test.use({ storageState: Users.userNotAllowedByApp.state });

		test('should prevent user from join the room', async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
			await poHomeChannel.sidenav.openDirectory();
			await poDirectory.openChannel(targetChannel);

			await expect(poHomeChannel.content.lastUserMessageBody).toContainText(targetChannelMessage);

			await poHomeChannel.btnJoinRoom.click();

			await expect(poUtils.getAlertByText('TEST OF NOT ALLOWED USER')).toBeVisible();
		});

		test('should prevent user from join the room without preview permission', async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin'] }] });

			await poHomeChannel.sidenav.openDirectory();
			await poDirectory.openChannel(targetChannel);
			await expect(poHomeChannel.content.lastUserMessageBody).not.toBeVisible();

			await poHomeChannel.content.btnJoinChannel.click();

			await expect(poUtils.getAlertByText('TEST OF NOT ALLOWED USER')).toBeVisible();
		});
	});
});
