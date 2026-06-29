import { faker } from '@faker-js/faker';
import type { IRoom } from '@rocket.chat/core-typings';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import {
	createTargetChannel,
	createTargetDiscussion,
	createTargetGroupAndReturnFullRoom,
	deleteRoom,
	sendTargetChannelMessage,
} from './utils';
import { test, expect } from './utils/test';

test.describe.serial('Join rooms', () => {
	test.use({ storageState: Users.user1.state });

	test.describe('public channels without preview-c-room', () => {
		let targetChannel: string;
		let poHomeChannel: HomeChannel;

		test.beforeEach(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
			await sendTargetChannelMessage(api, targetChannel, { msg: 'message from a channel the user has not joined' });
		});

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await page.goto(`/channel/${targetChannel}`);
		});

		test.afterEach(async ({ api }) => {
			await api.post('/channels.delete', { roomName: targetChannel });
		});

		test.beforeAll(async ({ api }) => {
			// restrict preview to admin so a regular user lands on the "not subscribed"
			// screen, whose "Join channel" button drives /v1/rooms.join via useJoinRoom
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin'] }] });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
		});

		test('should let a non-member join a public channel', async () => {
			await expect(poHomeChannel.btnJoinChannel).toBeVisible();
			await poHomeChannel.btnJoinChannel.click();
			await expect(poHomeChannel.btnJoinChannel).not.toBeVisible();
			await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		});
	});

	test.describe('public channel with preview-c-room', () => {
		let targetChannel: string;
		let poHomeChannel: HomeChannel;

		// Set the precondition explicitly instead of relying on the previous block's `afterAll`
		// to have restored the permission. That cross-block coupling is racy: if the restore
		// hasn't propagated, the user lands on the "not subscribed" screen and the composer's
		// Join button never renders.
		test.beforeAll(async ({ api }) => {
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
		});

		test.beforeEach(async ({ api }) => {
			targetChannel = await createTargetChannel(api);
			await sendTargetChannelMessage(api, targetChannel, { msg: 'message from a channel the user has not joined' });
		});

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			// `gotoChannel` waits for the room to finish loading, so the Join-button assertion
			// below doesn't race the preview render.
			await poHomeChannel.gotoChannel(targetChannel);
		});

		test.afterEach(async ({ api }) => {
			await api.post('/channels.delete', { roomName: targetChannel });
		});

		test('should let a non-member join a public channel', async () => {
			await expect(poHomeChannel.composer.btnJoinRoom).toBeVisible();
			await poHomeChannel.composer.btnJoinRoom.click();
			await expect(poHomeChannel.composer.btnJoinRoom).not.toBeVisible();
			await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		});
	});

	test.describe('discussion with preview-c-room', () => {
		test.use({ storageState: Users.user1.state });

		let poHomeChannel: HomeChannel;

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
		});

		let discussion: Record<string, string>;

		test.beforeAll(async ({ api }) => {
			// Don't depend on an earlier block's `afterAll` to restore preview-c-room (racy).
			await api.post('/permissions.update', { permissions: [{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] }] });
			discussion = await createTargetDiscussion(api);
		});

		test.afterAll(async ({ api }) => {
			await deleteRoom(api, discussion._id);
		});

		test('should let a non-member join a discussion', async () => {
			await poHomeChannel.gotoChannel(discussion.name);

			await expect(poHomeChannel.composer.btnJoinRoom).toBeVisible();

			await poHomeChannel.composer.btnJoinRoom.click();

			await expect(poHomeChannel.composer.btnJoinRoom).not.toBeVisible();
			await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		});
	});

	test.describe('discussion inside a private channel', () => {
		let poHomeChannel: HomeChannel;
		let group: IRoom;
		let discussion: Record<string, string>;

		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
		});

		test.beforeAll(async ({ api }) => {
			// The user is a member of the private parent but NOT of the discussion.
			// The discussion is type `p` and its access is inherited from the parent,
			// so `channels.join` could not resolve it but `rooms.join` can.
			({ group } = await createTargetGroupAndReturnFullRoom(api, { members: [Users.user1.data.username] }));
			const response = await api.post('/rooms.createDiscussion', { prid: group._id, t_name: faker.string.uuid() });
			({ discussion } = await response.json());
		});

		test.afterAll(async ({ api }) => {
			await deleteRoom(api, discussion._id);
			await api.post('/groups.delete', { roomId: group._id });
		});

		test('should let a parent member join a discussion in a private channel', async ({ page }) => {
			await page.goto(`/group/${discussion.name}`);

			await expect(poHomeChannel.composer.btnJoinRoom).toBeVisible();
			await poHomeChannel.composer.btnJoinRoom.click();

			await expect(poHomeChannel.composer.btnJoinRoom).not.toBeVisible();
			await expect(poHomeChannel.composer.inputMessage).toBeEnabled();
		});
	});
});
