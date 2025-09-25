import { faker } from '@faker-js/faker';

import { setupE2EEPassword } from './setupE2EEPassword';
import { Users } from '../fixtures/userStates';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { HomeSidenav } from '../page-objects/fragments';
import { FileUploadModal } from '../page-objects/fragments/file-upload-modal';
import { LoginPage } from '../page-objects/login';
import { deleteRoom } from '../utils/create-target-channel';
import { preserveSettings } from '../utils/preserveSettings';
import { resolvePrivateRoomId } from '../utils/resolve-room-id';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable', 'E2E_Allow_Unencrypted_Messages'];

preserveSettings(settingsList);

test.describe('E2EE Encryption and Decryption - Basic Features', () => {
	const createdChannels: { name: string; id?: string | null }[] = [];

	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(createdChannels.map(({ id }) => (id ? deleteRoom(api, id) : Promise.resolve())));
	});

	test.beforeEach(async ({ api, page }) => {
		const loginPage = new LoginPage(page);

		await api.post('/method.call/e2e.resetOwnE2EKey', {
			message: JSON.stringify({ msg: 'method', id: '1', method: 'e2e.resetOwnE2EKey', params: [] }),
		});

		await page.goto('/home');
		await loginPage.waitForIt();
		await loginPage.loginByUserState(Users.admin);
	});

	test('expect placeholder text in place of encrypted message', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const sidenav = new HomeSidenav(page);

		const channelName = faker.string.uuid();
		const messageText = 'This is an encrypted message.';

		await setupE2EEPassword(page);

		await sidenav.createEncryptedChannel(channelName);
		const roomId = await resolvePrivateRoomId(page, channelName);
		createdChannels.push({ name: channelName, id: roomId });

		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.encryptionNotReadyIndicator).not.toBeVisible();

		await encryptedRoomPage.sendMessage(messageText);
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.lastMessage.body).toHaveText(messageText);

		// Log out
		await sidenav.logout();

		// Login again
		await loginPage.loginByUserState(Users.admin);

		// Navigate to the encrypted channel WITHOUT entering the password

		await sidenav.openChat(channelName);
		await expect(encryptedRoomPage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.encryptionNotReadyIndicator).toBeVisible();

		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.lastMessage.body).toHaveText(
			'This message is end-to-end encrypted. To view it, you must enter your encryption key in your account settings.',
		);
	});

	test('expect placeholder text in place of encrypted file upload description', async ({ page }) => {
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const loginPage = new LoginPage(page);
		const fileUploadModal = new FileUploadModal(page);
		const sidenav = new HomeSidenav(page);

		const channelName = faker.string.uuid();
		const fileName = faker.system.commonFileName('txt');
		const fileDescription = faker.lorem.sentence();

		await setupE2EEPassword(page);

		// Create an encrypted channel
		await sidenav.createEncryptedChannel(channelName);
		const roomId = await resolvePrivateRoomId(page, channelName);
		createdChannels.push({ name: channelName, id: roomId });

		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.encryptionNotReadyIndicator).not.toBeVisible();

		await test.step('upload the file with encryption', async () => {
			// Upload a file
			await encryptedRoomPage.dragAndDropTxtFile();
			await fileUploadModal.setName(fileName);
			await fileUploadModal.setDescription(fileDescription);
			await fileUploadModal.send();

			// Check the file upload
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
			await expect(encryptedRoomPage.lastMessage.fileUploadName).toContainText(fileName);
			await expect(encryptedRoomPage.lastMessage.body).toHaveText(fileDescription);
		});

		await test.step('disable encryption in the room', async () => {
			await encryptedRoomPage.disableEncryption();
			await expect(encryptedRoomPage.encryptedIcon).not.toBeVisible();
		});

		await test.step('upload the file without encryption', async () => {
			await encryptedRoomPage.dragAndDropTxtFile();
			await fileUploadModal.setName(fileName);
			await fileUploadModal.setDescription(fileDescription);
			await fileUploadModal.send();

			await expect(encryptedRoomPage.lastMessage.encryptedIcon).not.toBeVisible();
			await expect(encryptedRoomPage.lastMessage.fileUploadName).toContainText(fileName);
			await expect(encryptedRoomPage.lastMessage.body).toHaveText(fileDescription);
		});

		await test.step('enable encryption in the room', async () => {
			await encryptedRoomPage.enableEncryption();
			await expect(encryptedRoomPage.encryptedIcon).toBeVisible();
		});

		// Log out
		await sidenav.logout();

		// Login again
		await loginPage.loginByUserState(Users.admin);

		await expect(sidenav.btnCreateNew).toBeVisible();

		await sidenav.openChat(channelName);
		await expect(encryptedRoomPage.encryptedIcon).toBeVisible();

		await expect(encryptedRoomPage.lastNthMessage(1).body).toHaveText(
			'This message is end-to-end encrypted. To view it, you must enter your encryption key in your account settings.',
		);
		await expect(encryptedRoomPage.lastNthMessage(1).encryptedIcon).toBeVisible();

		await expect(encryptedRoomPage.lastMessage.encryptedIcon).not.toBeVisible();
		await expect(encryptedRoomPage.lastMessage.fileUploadName).toContainText(fileName);
		await expect(encryptedRoomPage.lastMessage.body).toHaveText(fileDescription);
	});
});
