import { BASE_URL } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects/home-channel';
import { createTargetChannelAndReturnFullRoom, deleteRoom, sendMessage } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

const AUDIO_FILE = 'sample-audio.mp3';
const PRUNE_WINDOW_MS = 24 * 3600 * 1000;

test.describe('audio player closes when its message is no longer available', () => {
	let poHomeChannel: HomeChannel;
	let audioRoom: { _id: string; name: string };
	let otherRoom: { _id: string; name: string };

	test.beforeEach(async ({ page, api }) => {
		poHomeChannel = new HomeChannel(page);

		const { channel } = await createTargetChannelAndReturnFullRoom(api, { members: ['user1'] });
		audioRoom = { _id: channel._id, name: channel.name as string };

		const { channel: other } = await createTargetChannelAndReturnFullRoom(api);
		otherRoom = { _id: other._id, name: other.name as string };
	});

	test.afterEach(async ({ api }) => {
		await deleteRoom(api, audioRoom._id);
		await deleteRoom(api, otherRoom._id);
	});

	const sendAudio = async () => {
		await poHomeChannel.gotoChannel(audioRoom.name);
		await poHomeChannel.content.sendFileMessage(AUDIO_FILE);
		await expect(poHomeChannel.content.composer.getFileByName(AUDIO_FILE)).toBeVisible();
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.btnLastUserMessagePlay).toBeVisible();
	};

	const lastMessageId = async () => (await poHomeChannel.content.lastUserMessage.getAttribute('data-mid')) as string;

	const playThenPause = async () => {
		const { inputNowPlayingProgress, btnNowPlayingPause } = poHomeChannel.sidebar;

		await poHomeChannel.content.btnLastUserMessagePlay.click();
		await expect(inputNowPlayingProgress).toBeVisible();

		await btnNowPlayingPause.click();
		await expect(inputNowPlayingProgress).toBeVisible();
	};

	test('closes when the playing message is deleted while another room is open', async ({ api }) => {
		await sendAudio();
		const audioMessageId = await lastMessageId();
		await playThenPause();

		await poHomeChannel.navbar.openChat(otherRoom.name);
		await expect(poHomeChannel.sidebar.inputNowPlayingProgress).toBeVisible();

		expect((await api.post('/chat.delete', { roomId: audioRoom._id, msgId: audioMessageId, asUser: true })).status()).toBe(200);

		await expect(poHomeChannel.sidebar.inputNowPlayingProgress).not.toBeVisible();
	});

	test('closes when a prune removes the playing message', async ({ api }) => {
		await sendAudio();
		await playThenPause();

		expect(
			(
				await api.post('/rooms.cleanHistory', {
					roomId: audioRoom._id,
					latest: new Date(Date.now() + PRUNE_WINDOW_MS),
					oldest: new Date(Date.now() - PRUNE_WINDOW_MS),
				})
			).status(),
		).toBe(200);

		await expect(poHomeChannel.sidebar.inputNowPlayingProgress).not.toBeVisible();
	});

	test('closes when the quoted original is deleted in the same room', async ({ api }) => {
		await sendAudio();
		const originalMessageId = await lastMessageId();

		await sendMessage(api, audioRoom._id, `${BASE_URL}/channel/${audioRoom.name}?msg=${originalMessageId}`);
		await expect(poHomeChannel.content.btnPlayAudio).toHaveCount(2);

		await playThenPause();

		expect((await api.post('/chat.delete', { roomId: audioRoom._id, msgId: originalMessageId, asUser: true })).status()).toBe(200);

		await expect(poHomeChannel.sidebar.inputNowPlayingProgress).not.toBeVisible();
	});

	test('closes when the listener leaves the room', async ({ api }) => {
		await sendAudio();
		await playThenPause();

		expect((await api.post('/channels.addOwner', { roomId: audioRoom._id, userId: Users.user1.data._id })).status()).toBe(200);
		expect((await api.post('/channels.leave', { roomId: audioRoom._id })).status()).toBe(200);

		await expect(poHomeChannel.sidebar.inputNowPlayingProgress).not.toBeVisible();
	});
});
