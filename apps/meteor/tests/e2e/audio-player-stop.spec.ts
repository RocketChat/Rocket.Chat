import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects/home-channel';
import { createTargetChannelAndReturnFullRoom } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

// A local dev server serves an unminified bundle and needs longer to hydrate a room.
test.describe.configure({ timeout: 180 * 1000 });

const AUDIO_FILE = 'sample-audio.mp3';

// From the `Pinned_a_message` i18n key.
const PINNED_SYSTEM_MESSAGE = 'Pinned a message:';

// From the `Message_has_been_pinned` i18n key.
const PINNED_INDICATOR_TITLE = 'Message has been pinned';

test.describe('audio player stops when the audio is no longer available', () => {
	let poHomeChannel: HomeChannel;
	let createdRoomIds: string[] = [];

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		createdRoomIds = [];
	});

	// In afterEach: a failing test never reaches its own cleanup, and stale rooms slow later runs.
	test.afterEach(async ({ api }) => {
		await Promise.all(createdRoomIds.map((roomId) => api.post('/channels.delete', { roomId })));
	});

	const createRoom = async (api: Parameters<typeof createTargetChannelAndReturnFullRoom>[0], members?: string[]) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api, members ? { members } : undefined);
		createdRoomIds.push(channel._id);
		return channel;
	};

	// Keyed on the slider, not the play/pause button whose accessible name flips with state.
	const nowPlayingCard = (page: HomeChannel['page']) =>
		page.getByRole('navigation', { name: 'Sidebar' }).getByRole('slider', { name: 'Audio Playback Range' });

	const sendAudio = async (channel: string) => {
		await poHomeChannel.gotoChannel(channel);
		await poHomeChannel.content.sendFileMessage(AUDIO_FILE);
		// The upload lands in the composer first; sending before it is attached posts an empty message.
		await expect(poHomeChannel.content.composer.getFileByName(AUDIO_FILE)).toBeVisible();
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
	};

	const lastMessageIdOf = async (api: Parameters<typeof createTargetChannelAndReturnFullRoom>[0], roomId: string) => {
		const history = await (await api.get(`/channels.history?roomId=${roomId}&count=1`)).json();
		return history.messages[0]._id as string;
	};

	test('closes when the quoted original is deleted in another room', async ({ page, api }) => {
		const originRoom = await createRoom(api);
		const quotingRoom = await createRoom(api);

		await test.step('send the audio in the origin room', async () => {
			await sendAudio(originRoom.name!);
		});

		await test.step('quote it from another room by pasting its permalink', async () => {
			const originMessageId = await lastMessageIdOf(api, originRoom._id);
			const permalink = `${new URL(page.url()).origin}/channel/${originRoom.name}?msg=${originMessageId}`;

			// Opened from the sidebar; a second `gotoChannel` reloads the dev bundle and made this flaky.
			expect((await api.post('/chat.postMessage', { roomId: quotingRoom._id, text: permalink })).status()).toBe(200);
			await poHomeChannel.navbar.openChat(quotingRoom.name!);

			await expect(poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
		});

		await test.step('play the audio from the quote', async () => {
			await poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Play', exact: true }).click();
			await expect(nowPlayingCard(page)).toBeVisible();
		});

		await test.step('deleting the original in its own room closes the player', async () => {
			const originMessageId = await lastMessageIdOf(api, originRoom._id);

			expect((await api.post('/chat.delete', { roomId: originRoom._id, msgId: originMessageId, asUser: true })).status()).toBe(200);

			await expect(nowPlayingCard(page)).not.toBeVisible();
		});
	});

	test('keeps playing when a prune that excludes pinned messages spares the pinned message', async ({ page, api }) => {
		const targetChannel = await createRoom(api);

		await test.step('play the audio', async () => {
			await sendAudio(targetChannel.name!);
			await poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Play', exact: true }).click();
			await expect(nowPlayingCard(page)).toBeVisible();
		});

		await test.step('pin the message while it is playing', async () => {
			// Pinning appends a system message, so take the audio id first.
			const audioMessageId = await lastMessageIdOf(api, targetChannel._id);

			// Pinned through the UI: the API gives no signal for when the client has applied it.
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionPinMessage.click();
			await page.getByRole('button', { name: 'Yes, pin message' }).click();

			await expect.poll(async () => (await (await api.get(`/chat.getMessage?msgId=${audioMessageId}`)).json()).message?.pinned).toBe(true);

			await expect(page.getByTitle(PINNED_INDICATOR_TITLE)).toBeVisible();
		});

		await test.step('a prune excluding pinned messages leaves playback alone', async () => {
			// The pin's system message is not itself pinned, so the prune takes it — an observable signal.
			await expect(poHomeChannel.content.getSystemMessageByText(PINNED_SYSTEM_MESSAGE)).toBeVisible();

			expect(
				(
					await api.post('/rooms.cleanHistory', {
						roomId: targetChannel._id,
						excludePinned: true,
						latest: new Date(Date.now() + 30 * 24 * 3600 * 1000),
						oldest: new Date(Date.now() - 30 * 24 * 3600 * 1000),
					})
				).status(),
			).toBe(200);

			// The client refetches history after a prune, so this waits on a round trip.
			await expect(poHomeChannel.content.getSystemMessageByText(PINNED_SYSTEM_MESSAGE)).not.toBeVisible({ timeout: 15_000 });

			await expect(nowPlayingCard(page)).toBeVisible();
		});
	});

	test('closes when the listener leaves the room the audio belongs to', async ({ page, api }) => {
		const targetChannel = await createRoom(api, ['user1']);

		await test.step('play the audio', async () => {
			await sendAudio(targetChannel.name!);
			await poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Play', exact: true }).click();
			await expect(nowPlayingCard(page)).toBeVisible();
		});

		await test.step('leave the room', async () => {
			// A channel's last owner cannot leave it, so hand ownership over first.
			expect((await api.post('/channels.addOwner', { roomId: targetChannel._id, userId: Users.user1.data._id })).status()).toBe(200);
			expect((await api.post('/channels.leave', { roomId: targetChannel._id })).status()).toBe(200);

			await expect(nowPlayingCard(page)).not.toBeVisible();
		});
	});
});
