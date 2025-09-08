import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { getSettingValueById } from '../utils';
import { test, expect } from '../utils/test';

const settings = {
	E2E_Enable: false as unknown,
	E2E_Allow_Unencrypted_Messages: false as unknown,
	E2E_Enable_Encrypt_Files: false as unknown,
	E2E_Enabled_Default_DirectRooms: false as unknown,
	E2E_Enabled_Default_PrivateRooms: false as unknown,
};

test.beforeAll(async ({ api }) => {
	settings.E2E_Enable = await getSettingValueById(api, 'E2E_Enable');
	settings.E2E_Allow_Unencrypted_Messages = await getSettingValueById(api, 'E2E_Allow_Unencrypted_Messages');
	settings.E2E_Enable_Encrypt_Files = await getSettingValueById(api, 'E2E_Enable_Encrypt_Files');
	settings.E2E_Enabled_Default_DirectRooms = await getSettingValueById(api, 'E2E_Enabled_Default_DirectRooms');
	settings.E2E_Enabled_Default_PrivateRooms = await getSettingValueById(api, 'E2E_Enabled_Default_PrivateRooms');
});

test.afterAll(async ({ api }) => {
	await api.post('/settings/E2E_Enable', { value: settings.E2E_Enable });
	await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: settings.E2E_Allow_Unencrypted_Messages });
	await api.post('/settings/E2E_Enable_Encrypt_Files', { value: settings.E2E_Enable_Encrypt_Files });
	await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: settings.E2E_Enabled_Default_DirectRooms });
	await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: settings.E2E_Enabled_Default_PrivateRooms });
});

test.describe('E2EE File Encryption', () => {
	let poHomeChannel: HomeChannel;

	test.use({ storageState: Users.userE2EE.state });

	test.beforeAll(async ({ api }) => {
		await api.post('/settings/E2E_Enable', { value: true });
		await api.post('/settings/E2E_Allow_Unencrypted_Messages', { value: true });
		await api.post('/settings/E2E_Enabled_Default_DirectRooms', { value: false });
		await api.post('/settings/E2E_Enabled_Default_PrivateRooms', { value: false });
		await api.post('/im.delete', { roomId: `user2${Users.userE2EE.data.username}` });
	});

	test.afterAll(async ({ api }) => {
		await api.post('/settings/FileUpload_MediaTypeWhiteList', { value: '' });
		await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'image/svg+xml' });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('File and description encryption', async ({ page }) => {
		await test.step('create an encrypted channel', async () => {
			const channelName = faker.string.uuid();

			await poHomeChannel.sidenav.createEncryptedChannel(channelName);

			await expect(page).toHaveURL(`/group/${channelName}`);

			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

		await test.step('send a file in channel', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.descriptionInput.fill('any_description');
			await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.lastUserMessage.locator('.rcx-icon--name-key')).toBeVisible();
			await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
			await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
		});
	});

	test('File encryption with whitelisted and blacklisted media types', async ({ page, api }) => {
		await test.step('create an encrypted room', async () => {
			const channelName = faker.string.uuid();

			await poHomeChannel.sidenav.createEncryptedChannel(channelName);

			await expect(page).toHaveURL(`/group/${channelName}`);

			await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
		});

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
			await api.post('/settings/E2E_Enable_Encrypt_Files', { value: settings.E2E_Enable_Encrypt_Files });
			await api.post('/settings/FileUpload_MediaTypeBlackList', { value: 'image/svg+xml' });
		});

		test('Upload file without encryption in e2ee room', async ({ page }) => {
			await test.step('create an encrypted channel', async () => {
				const channelName = faker.string.uuid();

				await poHomeChannel.sidenav.createEncryptedChannel(channelName);

				await expect(page).toHaveURL(`/group/${channelName}`);

				await expect(poHomeChannel.content.encryptedRoomHeaderIcon).toBeVisible();
			});

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
