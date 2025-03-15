import { Users } from './fixtures/userStates';
import { HomeChannel, Utils } from './page-objects';
import { Directory } from './page-objects/directory';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('Preview public channel', () => {
	let poHomeChannel: HomeChannel;
	let poDirectory: Directory;
	let poUtils: Utils;
	let targetChannel: string;

	test.beforeEach(async ({ page, api }) => {
		poHomeChannel = new HomeChannel(page);
		targetChannel = await createTargetChannel(api);
		poDirectory = new Directory(page);
		poUtils = new Utils(page);

		await page.goto('/home');
	});

	test.afterEach(async ({ api }) => {
		await api.post('/channels.delete', { roomName: targetChannel });
	});

	test.describe('without preview public room permission', () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin'] }] });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
		});

		test('should not let user role preview public rooms', async () => {
			await poHomeChannel.sidenav.openDirectory();
			await poDirectory.openChannel(targetChannel);

			expect(poHomeChannel.content.btnJoinChannel).toBeVisible;
		});

		test.describe('apps', () => {
			test.use({ storageState: Users.userNotAllowedByApp.state });

			test('should prevent user from join the room', async () => {
				await poHomeChannel.sidenav.openDirectory();
				await poDirectory.openChannel(targetChannel);
				await poHomeChannel.content.btnJoinChannel.click();

				expect(poUtils.getAlertByText('TEST OF NOT ALLOWED USER')).toBeVisible;
			});
		});
	});
});
