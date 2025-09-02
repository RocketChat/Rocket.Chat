import { faker } from '@faker-js/faker';

import injectInitialData from '../fixtures/inject-initial-data';
import { Users } from '../fixtures/userStates';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { HomeSidenav } from '../page-objects/fragments';
import { SaveE2EEPasswordBanner, SaveE2EEPasswordModal } from '../page-objects/fragments/e2ee';
import { ExportMessagesTab } from '../page-objects/fragments/export-messages-tab';
import { FileUploadModal } from '../page-objects/fragments/file-upload-modal';
import { LoginPage } from '../page-objects/login';
import { test, expect } from '../utils/test';

test.beforeAll(async () => {
	await injectInitialData();
});

test.describe('e2e encryption - basic features', () => {
	test.use({ storageState: Users.admin.state });

	const createdChannels: string[] = [];

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
	});

	test.afterAll(async ({ api }) => {
		await Promise.all(
			createdChannels.map(async (channelName) => {
				await api.post('/groups.delete', { roomName: channelName });
			}),
		);

		await api.post('/settings/E2E_Enable', { value: false });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: false });
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
		const saveE2EEPasswordBanner = new SaveE2EEPasswordBanner(page);
		const saveE2EEPasswordModal = new SaveE2EEPasswordModal(page);
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const sidenav = new HomeSidenav(page);

		const channelName = faker.string.uuid();
		createdChannels.push(channelName);
		const messageText = 'This is an encrypted message.';

		await saveE2EEPasswordBanner.click();
		await saveE2EEPasswordModal.confirm();
		await saveE2EEPasswordBanner.waitForDisappearance();

		await sidenav.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.encryptionNotReadyIndicator).not.toBeVisible();

		await encryptedRoomPage.sendMessage(messageText);
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.lastMessage.body).toHaveText(messageText);

		await sidenav.logout();

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
		const saveE2EEPasswordBanner = new SaveE2EEPasswordBanner(page);
		const saveE2EEPasswordModal = new SaveE2EEPasswordModal(page);
		const fileUploadModal = new FileUploadModal(page);
		const sidenav = new HomeSidenav(page);

		const channelName = faker.string.uuid();
		createdChannels.push(channelName);
		const fileName = faker.system.commonFileName('txt');
		const fileDescription = faker.lorem.sentence();

		// Click the banner to open the dialog to save the generated password
		await saveE2EEPasswordBanner.click();
		await saveE2EEPasswordModal.confirm();
		await saveE2EEPasswordBanner.waitForDisappearance();

		// Create an encrypted channel
		await sidenav.createEncryptedChannel(channelName);

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

	test('should display only the download file method when exporting messages in an e2ee room', async ({ page }) => {
		const sidenav = new HomeSidenav(page);
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const exportMessagesTab = new ExportMessagesTab(page);

		const channelName = faker.string.uuid();
		createdChannels.push(channelName);

		await sidenav.createEncryptedChannel(channelName);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedRoomHeaderIcon).toBeVisible();

		await encryptedRoomPage.showExportMessagesTab();
		await expect(exportMessagesTab.method).toContainClass('disabled'); // FIXME: looks like the component have an a11y issue
		await expect(exportMessagesTab.method).toHaveAccessibleName('Download file');
	});

	test('should allow exporting messages as PDF in an encrypted room', async ({ page }) => {
		const sidenav = new HomeSidenav(page);
		const encryptedRoomPage = new EncryptedRoomPage(page);
		const exportMessagesTab = new ExportMessagesTab(page);

		const channelName = faker.string.uuid();
		createdChannels.push(channelName);

		await sidenav.createEncryptedChannel(channelName);
		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedRoomHeaderIcon).toBeVisible();

		await encryptedRoomPage.sendMessage('This is a message to export as PDF.');
		await encryptedRoomPage.showExportMessagesTab();
		await expect(exportMessagesTab.method).toHaveAccessibleName('Download file');

		// Select Output format as PDF
		await exportMessagesTab.setOutputFormat('PDF');

		// select messages to be exported
		await exportMessagesTab.selectAllMessages();

		// Wait for download event and match format
		const download = await exportMessagesTab.downloadMessages();
		expect(download.suggestedFilename()).toMatch(/\.pdf$/);
	});
});
