import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { createTargetGroupAndReturnFullRoom } from '../utils';
import { preserveSettings } from '../utils/preserveSettings';
import { test, expect } from '../utils/test';

const settingsList = [
	'E2E_Enable',
	'E2E_Allow_Unencrypted_Messages',
	'E2E_Enable_Encrypt_Files',
	'E2E_Enabled_Default_DirectRooms',
	'E2E_Enabled_Default_PrivateRooms',
];

const originalSettings = preserveSettings(settingsList);

test.use({ storageState: Users.userE2EE.state });

test.describe('E2EE File Encryption', () => {
	let poHomeChannel: HomeChannel;
	let encryptedRoomId: string;

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { username: 'user2' });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/FileUpload_MediaTypeWhiteList', { value: '' });
		await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'image/svg+xml' });
	});

	test.beforeEach(async ({ api, page }) => {
		poHomeChannel = new HomeChannel(page);
		const { group } = await createTargetGroupAndReturnFullRoom(api, {
			extraData: {
				broadcast: false,
				encrypted: true,
			},
			members: [Users.userE2EE.data._id],
		});

		encryptedRoomId = group._id;

		await page.goto(`/group/${group.name}`);
		await page.locator('#main-content').waitFor();
		await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
	});

	test.afterEach(async ({ api }) => {
		expect((await api.post('/groups.delete', { roomId: encryptedRoomId })).status()).toBe(200);
	});

	test('File and description encryption and editing the description', async ({ page }) => {
		await test.step('send a file in channel', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.descriptionInput.fill('any_description');
			await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
			await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
			await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
		});

		await test.step('edit the description', async () => {
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionEditMessage.click();

			expect(await poHomeChannel.composer.inputMessage.inputValue()).toBe('any_description');

			await poHomeChannel.composer.inputMessage.fill('edited any_description');
			await page.keyboard.press('Enter');

			await expect(poHomeChannel.content.getFileDescription).toHaveText('edited any_description');
		});

		await test.step('delete the file from files list', async () => {
			await poHomeChannel.roomToolbar.openMoreOptions();
			await poHomeChannel.roomToolbar.menuItemFiles.click();
			await poHomeChannel.tabs.files.deleteFile('any_file1.txt');

			await expect(poHomeChannel.tabs.files.getFileByName('any_file1.txt')).toHaveCount(0);
			await expect(poHomeChannel.content.lastUserMessage).not.toBeVisible();
		});
	});

	test('File encryption with whitelisted and blacklisted media types', async ({ api }) => {
		await test.step('send a text file in channel', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.descriptionInput.fill('message 1');
			await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
			await expect(poHomeChannel.content.getFileDescription).toHaveText('message 1');
			await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
		});

		await test.step('set whitelisted media type setting', async () => {
			await api.post('/settings/FileUpload_MediaTypeWhiteList', { value: 'text/plain' });
		});

		await test.step('send text file again with whitelist setting set', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.descriptionInput.fill('message 2');
			await poHomeChannel.content.fileNameInput.fill('any_file2.txt');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
			await expect(poHomeChannel.content.getFileDescription).toHaveText('message 2');
			await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file2.txt');
		});

		await test.step('set blacklisted media type setting to not accept application/octet-stream media type', async () => {
			await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'application/octet-stream' });
		});

		await test.step('send text file again with blacklisted setting set, file upload should fail', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.descriptionInput.fill('message 3');
			await poHomeChannel.content.fileNameInput.fill('any_file3.txt');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
			await expect(poHomeChannel.content.getFileDescription).toHaveText('message 2');
			await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file2.txt');
		});
	});

	test.describe('File encryption setting disabled', () => {
		test.beforeAll(async ({ api }) => {
			await api.post('/settings/E2E_Enable_Encrypt_Files', { value: false });
			await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'application/octet-stream' });
		});

		test.afterAll(async ({ api }) => {
			await api.post('/settings/E2E_Enable_Encrypt_Files', { value: originalSettings.E2E_Enable_Encrypt_Files });
			await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'image/svg+xml' });
		});

		test('Upload file without encryption in e2ee room', async () => {
			await test.step('send a test encrypted message to check e2ee is working', async () => {
				await poHomeChannel.content.sendMessage('This is an encrypted message.');

				await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('This is an encrypted message.');
				await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
			});

			await test.step('send a text file in channel, file should not be encrypted', async () => {
				await poHomeChannel.content.dragAndDropTxtFile();
				await poHomeChannel.content.descriptionInput.fill('any_description');
				await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
				await poHomeChannel.content.btnModalConfirm.click();

				await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).not.toBeVisible();
				await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
				await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
			});
		});
	});
});
