import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { CreateE2EEChannel } from '../page-objects/fragments/e2ee';
import { deleteRoom } from '../utils/create-target-channel';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable'];

preserveSettings(settingsList);

test.describe('E2EE Thread Messages', () => {
	const createdChannels: { name: string; id?: string | null }[] = [];
	let poHomeChannel: HomeChannel;
	let encryptedRoomPage: EncryptedRoomPage;
	let createE2EEChannel: CreateE2EEChannel;
	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		encryptedRoomPage = new EncryptedRoomPage(page);
		createE2EEChannel = new CreateE2EEChannel(page);
		await poHomeChannel.goto();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map(({ id }) => (id ? deleteRoom(api, id) : Promise.resolve())));
	});

	test('expect create a private encrypted channel and send an encrypted thread message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await createE2EEChannel.createAndStore(channelName, createdChannels);
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send main thread message', async () => {
			await poHomeChannel.content.sendMessage('This is the thread main message.');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is the thread main message.');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		});

		await test.step('open reply in thread', async () => {
			await poHomeChannel.content.openReplyInThread();
			await expect(page).toHaveURL(/.*thread/);
		});

		await test.step('verify main thread message is encrypted', async () => {
			await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		});

		await test.step('send encrypted reply on thread message', async () => {
			await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
			await poHomeChannel.content.sendMessageInThread('This is an encrypted thread message also sent in channel');
		});

		await test.step('verify all thread messages are encrypted', async () => {
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is an encrypted thread message also sent in channel');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText('This is an encrypted thread message also sent in channel');
			await expect(poHomeChannel.content.mainThreadMessageText).toContainText('This is the thread main message.');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		});
	});
});
