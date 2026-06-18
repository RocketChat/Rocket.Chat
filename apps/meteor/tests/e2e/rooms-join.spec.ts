import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetDiscussion, deleteRoom, sendTargetChannelMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('rooms.join', () => {
	let poHomeChannel: HomeChannel;

	test.beforeAll(async ({ api }) => {
		// restrict preview to admin so a regular user lands on the "not subscribed"
		// screen, whose "Join channel" button drives /v1/rooms.join via useJoinRoom
		await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin'] }] });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.describe('public channel', () => {
		test.use({ storageState: Users.user1.state });

		let targetChannel: string;

		test.beforeAll(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
			await sendTargetChannelMessage(api, targetChannel, { msg: 'message from a channel the user has not joined' });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/channels.delete', { roomName: targetChannel });
		});

		test('should let a non-member join a public channel', async ({ page }) => {
			await page.goto(`/channel/${targetChannel}`);

			await expect(poHomeChannel.btnJoinChannel).toBeVisible();

			await poHomeChannel.btnJoinChannel.click();

			await expect(poHomeChannel.btnJoinChannel).not.toBeVisible();
			await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		});
	});

	test.describe('discussion', () => {
		test.use({ storageState: Users.user1.state });

		let discussion: Record<string, string>;

		test.beforeAll(async ({ api }) => {
			discussion = await createTargetDiscussion(api);
		});

		test.afterAll(async ({ api }) => {
			await deleteRoom(api, discussion._id);
		});

		test('should let a non-member join a discussion', async ({ page }) => {
			await page.goto(`/channel/${discussion.name}`);

			await expect(poHomeChannel.btnJoinChannel).toBeVisible();

			await poHomeChannel.btnJoinChannel.click();

			await expect(poHomeChannel.btnJoinChannel).not.toBeVisible();
			await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		});
	});
});
