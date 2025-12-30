import { faker } from '@faker-js/faker';

import { setupE2EEPassword } from './setupE2EEPassword';
import { BASE_URL } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { EncryptedRoomPage } from '../page-objects/encrypted-room';
import { Navbar } from '../page-objects/fragments';
import { FileUploadModal } from '../page-objects/fragments/modals';
import { LoginPage } from '../page-objects/login';
import { createTargetGroupAndReturnFullRoom, deleteChannel, deleteRoom } from '../utils';
import { preserveSettings } from '../utils/preserveSettings';
import { sendMessageFromUser } from '../utils/sendMessage';
import { test, expect } from '../utils/test';

const settingsList = ['E2E_Enable', 'E2E_Allow_Unencrypted_Messages'];

preserveSettings(settingsList);

test.describe('E2EE Encryption and Decryption - Basic Features', () => {
	let loginPage: LoginPage;
	let navbar: Navbar;
	let encryptedRoomPage: EncryptedRoomPage;

	test.use({ storageState: Users.admin.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
	});

	test.beforeEach(async ({ api, page }) => {
		loginPage = new LoginPage(page);
		navbar = new Navbar(page);
		encryptedRoomPage = new EncryptedRoomPage(page);

		await api.post('/method.call/e2e.resetOwnE2EKey', {
			message: JSON.stringify({ msg: 'method', id: '1', method: 'e2e.resetOwnE2EKey', params: [] }),
		});

		await page.goto('/home');
		await loginPage.waitForIt();
		await loginPage.loginByUserState(Users.admin);
	});

	test('expect placeholder text in place of encrypted message', async ({ page }) => {
		const channelName = faker.string.uuid();
		const messageText = 'This is an encrypted message.';

		await setupE2EEPassword(page);

		await navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);
		await encryptedRoomPage.waitForChannel();
		await expect(encryptedRoomPage.encryptedTitle).toBeVisible();
		await expect(encryptedRoomPage.encryptionNotReadyIndicator).not.toBeVisible();

		await encryptedRoomPage.sendMessage(messageText);
		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.lastMessage.body).toHaveText(messageText);

		// Log out
		await navbar.logout();

		// Login again
		await loginPage.loginByUserState(Users.admin);

		// Navigate to the encrypted channel WITHOUT entering the password

		await navbar.openChat(channelName);
		await expect(encryptedRoomPage.encryptedTitle).toBeVisible();
		await expect(encryptedRoomPage.encryptionNotReadyIndicator).toBeVisible();

		await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
		await expect(encryptedRoomPage.lastMessage.body).toHaveText(
			'This message is end-to-end encrypted. To view it, you must enter your encryption key in your account settings.',
		);
	});

	test('expect placeholder text in place of encrypted file upload description', async ({ page }) => {
		const fileUploadModal = new FileUploadModal(page);

		const channelName = faker.string.uuid();
		const fileName = faker.system.commonFileName('txt');
		const fileDescription = faker.lorem.sentence();

		await setupE2EEPassword(page);

		// Create an encrypted channel
		await navbar.createEncryptedChannel(channelName);

		await expect(page).toHaveURL(`/group/${channelName}`);
		await expect(encryptedRoomPage.encryptedTitle).toBeVisible();
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
			await expect(encryptedRoomPage.encryptedTitle).not.toBeVisible();
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
			await expect(encryptedRoomPage.encryptedTitle).toBeVisible();
		});

		// Log out
		await navbar.logout();

		// Login again
		await loginPage.loginByUserState(Users.admin);

		await expect(navbar.btnCreateNew).toBeVisible();

		await navbar.openChat(channelName);
		await expect(encryptedRoomPage.encryptedTitle).toBeVisible();

		await expect(encryptedRoomPage.lastNthMessage(1).body).toHaveText(
			'This message is end-to-end encrypted. To view it, you must enter your encryption key in your account settings.',
		);
		await expect(encryptedRoomPage.lastNthMessage(1).encryptedIcon).toBeVisible();

		await expect(encryptedRoomPage.lastMessage.encryptedIcon).not.toBeVisible();
		await expect(encryptedRoomPage.lastMessage.fileUploadName).toContainText(fileName);
		await expect(encryptedRoomPage.lastMessage.body).toHaveText(fileDescription);
	});

	test.describe('E2EE Quotes', () => {
		let targetRoomId: string;
		let targetChannelName: string;

		test.afterAll(async ({ api }) => {
			await deleteRoom(api, targetRoomId);
			await deleteChannel(api, targetChannelName);
		});

		test('expect to not crash and not show quote message for a message_link which is not accessible to the user', async ({
			page,
			request,
			api,
		}) => {
			const encryptedRoomPage = new EncryptedRoomPage(page);
			targetChannelName = faker.string.uuid();

			await navbar.createEncryptedChannel(targetChannelName);

			await expect(page).toHaveURL(`/group/${targetChannelName}`);
			await expect(encryptedRoomPage.encryptedTitle).toBeVisible();
			await expect(encryptedRoomPage.encryptionNotReadyIndicator).not.toBeVisible();

			await encryptedRoomPage.sendMessage('First encrypted message.');
			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
			await expect(encryptedRoomPage.lastMessage.body).toHaveText('First encrypted message.');

			// create a private group for user2
			const { group: user1Channel } = await createTargetGroupAndReturnFullRoom(api, {
				excludeSelf: true,
				members: [Users.user2.data._id],
			});
			targetRoomId = user1Channel._id;

			// send a message to the private group, which is not accessible to the main user
			const sentMessage = (await sendMessageFromUser(request, Users.user2, targetRoomId, 'This is a test message.')).message;

			const messageLink = `${BASE_URL}/group/${user1Channel.name}?msg=${sentMessage._id}`;

			await encryptedRoomPage.sendMessage(`This is a message with message link - ${messageLink}`);

			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
			await expect(encryptedRoomPage.lastMessage.body).toContainText(`This is a message with message link - ${messageLink}`);
			await expect(encryptedRoomPage.lastNthMessage(1).body).toContainText('First encrypted message.');

			await page.reload();

			await expect(encryptedRoomPage.lastMessage.encryptedIcon).toBeVisible();
			await expect(encryptedRoomPage.lastMessage.body).toContainText(`This is a message with message link - ${messageLink}`);
			await expect(encryptedRoomPage.lastNthMessage(1).body).toContainText('First encrypted message.');
		});
	});
});
