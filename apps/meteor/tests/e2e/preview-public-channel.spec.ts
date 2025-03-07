import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { Directory } from './page-objects/directory';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe('Preview public channel', () => {
	let poHomeChannel: HomeChannel;
	let poDirectory: Directory;
	let targetChannel: string;

	test.beforeEach(async ({ page, api }) => {
		poHomeChannel = new HomeChannel(page);
		targetChannel = await createTargetChannel(api);
		poDirectory = new Directory(page);

		await page.goto('/home');
	});

	test.describe('without preview public room permission', () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin'] }] });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/channels.delete', { roomName: targetChannel });
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
		});

		test('should not let user role preview public rooms', async () => {
			await poHomeChannel.sidenav.openDirectory();
			await poDirectory.openChannel(targetChannel);

			expect(poHomeChannel.content.btnJoinChannel).toBeVisible;
		});
	});
});
