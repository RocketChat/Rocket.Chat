import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { DisableRoomEncryptionModal, EnableRoomEncryptionModal, CreateE2EEChannel } from '../page-objects/fragments/e2ee';
import { deleteRoom } from '../utils/create-target-channel';
import { preserveSettings } from '../utils/preserveSettings';
import { resolvePrivateRoomId } from '../utils/resolve-room-id';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable', 'E2E_Allow_Unencrypted_Messages'];

preserveSettings(settingsList);

test.describe('E2EE Channel Basic Functionality', () => {
	const createdChannels: { name: string; id?: string | null }[] = [];
	let poHomeChannel: HomeChannel;
	let encryptedRoomPage: EncryptedRoomPage;
	let enableEncryptionModal: EnableRoomEncryptionModal;
	let disableEncryptionModal: DisableRoomEncryptionModal;
	let createE2EEChannel: CreateE2EEChannel;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		enableEncryptionModal = new EnableRoomEncryptionModal(page);
		disableEncryptionModal = new DisableRoomEncryptionModal(page);
		encryptedRoomPage = new EncryptedRoomPage(page);
		createE2EEChannel = new CreateE2EEChannel(page);
		await poHomeChannel.goto();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map(({ id }) => (id ? deleteRoom(api, id) : Promise.resolve())));
	});

	test('expect create a private channel encrypted and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create encrypted channel', async () => {
			await createE2EEChannel.createAndStore(channelName, createdChannels);
			await poHomeChannel.content.waitForChannel();
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message and verify encryption', async () => {
			await poHomeChannel.content.sendMessage('hello world');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		});

		await test.step('disable encryption', async () => {
			await poHomeChannel.tabs.kebab.click({ force: true });
			await expect(poHomeChannel.tabs.btnDisableE2E).toBeVisible();
			await poHomeChannel.tabs.btnDisableE2E.click({ force: true });
			await disableEncryptionModal.disable();
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeHidden();
		});

		await test.step('send unencrypted message and verify no encryption', async () => {
			await poHomeChannel.content.sendMessage('hello world not encrypted');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world not encrypted');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).not.toBeVisible();
		});

		await test.step('re-enable encryption', async () => {
			await poHomeChannel.tabs.kebab.click({ force: true });
			await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
			await poHomeChannel.tabs.btnEnableE2E.click({ force: true });
			await enableEncryptionModal.enable();
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message again and verify encryption restored', async () => {
			await poHomeChannel.content.sendMessage('hello world encrypted again');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world encrypted again');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		});
	});

	test('expect create a private channel, encrypt it and send an encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();

		await test.step('create private channel', async () => {
			await poHomeChannel.sidenav.openNewByLabel('Channel');
			await poHomeChannel.sidenav.inputChannelName.fill(channelName);
			await poHomeChannel.sidenav.btnCreate.click();

			await poHomeChannel.content.waitForChannel();
			const roomId = await resolvePrivateRoomId(page, channelName);

			createdChannels.push({ name: channelName, id: roomId ?? undefined });
			await expect(page).toHaveURL(`/group/${channelName}`);
			await expect(poHomeChannel.toastSuccess).toBeVisible();
			await poHomeChannel.dismissToast();
		});

		await test.step('enable encryption', async () => {
			await poHomeChannel.tabs.kebab.click();
			await expect(poHomeChannel.tabs.btnEnableE2E).toBeVisible();
			await poHomeChannel.tabs.btnEnableE2E.click();
			await enableEncryptionModal.enable();
			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send encrypted message and verify', async () => {
			await poHomeChannel.content.sendMessage('hello world');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('hello world');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		});
	});
});
