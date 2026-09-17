import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects/home-channel';
import { createTargetChannelAndReturnFullRoom } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

// The suite is normally run against a production build; a local dev server serves an unminified
// bundle and needs noticeably longer to hydrate a room.
test.describe.configure({ timeout: 180 * 1000 });

const AUDIO_FILE = 'sample-audio.mp3';

// Rendered text of the `message_pinned` system message, from the `Pinned_a_message` key.
const PINNED_SYSTEM_MESSAGE = 'Pinned a message:';

/**
 * The shared player is only meant to keep running while the audio is still the listener's to
 * hear. These cover the three ways that can stop being true without the playing message itself
 * being deleted in the room being viewed.
 */
test.describe('audio player stops when the audio is no longer available', () => {
	let poHomeChannel: HomeChannel;
	let createdRoomIds: string[] = [];

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		createdRoomIds = [];
	});

	// In afterEach rather than at the end of each test: a failing test never reaches its own
	// cleanup, and rooms left behind accumulate in the admin's sidebar, slowing every later run
	// until the page stops hydrating within the timeout.
	test.afterEach(async ({ api }) => {
		await Promise.all(createdRoomIds.map((roomId) => api.post('/channels.delete', { roomId })));
	});

	const createRoom = async (api: Parameters<typeof createTargetChannelAndReturnFullRoom>[0], members?: string[]) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api, members ? { members } : undefined);
		createdRoomIds.push(channel._id);
		return channel;
	};

	/**
	 * The Now Playing card. Identified by the player's own slider rather than its play/pause
	 * button, whose accessible name flips with playback state, and scoped to the sidebar so it is
	 * not confused with the player rendered inside the message itself.
	 */
	const nowPlayingCard = (page: HomeChannel['page']) =>
		page.getByRole('navigation', { name: 'Sidebar' }).getByRole('slider', { name: 'Audio Playback Range' });

	const sendAudio = async (channel: string) => {
		await poHomeChannel.gotoChannel(channel);
		await poHomeChannel.content.sendFileMessage(AUDIO_FILE);
		// The upload lands in the composer first; sending before it is attached posts an empty message.
		await expect(poHomeChannel.content.composer.getFileByName(AUDIO_FILE)).toBeVisible();
		await poHomeChannel.composer.btnSend.click();
		// An audio attachment renders its filename as plain text, not a link, so assert on the
		// player itself — which is what the rest of the test needs anyway.
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

			// Posted over REST and opened from the sidebar rather than a second `gotoChannel`: that
			// helper does a full `page.goto`, and a second reload of the dev bundle is what made this
			// test hang intermittently. The quote itself is built server-side either way.
			expect((await api.post('/chat.postMessage', { roomId: quotingRoom._id, text: permalink })).status()).toBe(200);
			await poHomeChannel.navbar.openChat(quotingRoom.name!);

			// The quote is built server-side, so this also proves the permalink resolved.
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
			// Pinning appends a `message_pinned` system message, so the audio is no longer the last
			// one afterwards — take its id first.
			const audioMessageId = await lastMessageIdOf(api, targetChannel._id);

			// Pinned through the UI on purpose: the client must have processed the pin before the
			// prune arrives, and an API call gives no signal for when that has happened.
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionPinMessage.click();
			await page.getByRole('button', { name: 'Yes, pin message' }).click();

			// Separates a server-side pin failure from a player bug if this ever regresses.
			await expect.poll(async () => (await (await api.get(`/chat.getMessage?msgId=${audioMessageId}`)).json()).message?.pinned).toBe(true);
		});

		await test.step('a prune excluding pinned messages leaves playback alone', async () => {
			// The pin's own system message is not itself pinned, so the prune takes it while
			// sparing the audio. That gives the step something observable to wait on: asserting
			// the player is still up is only meaningful once the client has actually applied the
			// deletion, and a fixed wait would let a slow stream arrive after the assertion.
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

			// Longer than the default: the client reacts to the prune by refetching the history,
			// so this waits on a round trip rather than on a local state update.
			await expect(poHomeChannel.content.getSystemMessageByText(PINNED_SYSTEM_MESSAGE)).not.toBeVisible({ timeout: 15_000 });

			// The server kept the pinned message, so the player must keep it too.
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
