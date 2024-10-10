import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('file-upload', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml');
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml');
		await setSettingValueById(api, 'FileUpload_MaxFileSize', 104857600);
		await setSettingValueById(api, 'Message_MaxAllowedSize', 5000);
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('expect successfully cancel upload', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.btnModalCancel.click();
		await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
	});

	test('expect send file not show modal', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
	});

	test('expect send file with name/description updated', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
	});

	test('expect send lst file succesfully', async () => {
		await poHomeChannel.content.dragAndDropLstFile();
		await poHomeChannel.content.descriptionInput.fill('lst_description');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('lst_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('lst-test.lst');
	});

	test('expect send drawio (unknown media type) file succesfully', async ({ page }) => {
		await page.reload();
		await poHomeChannel.content.sendFileMessage('diagram.drawio');
		await poHomeChannel.content.descriptionInput.fill('drawio_description');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('drawio_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('diagram.drawio');
	});

	test('expect not to send drawio file (unknown media type) when the default media type is blocked', async ({ api, page }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream');

		await page.reload();
		await poHomeChannel.content.sendFileMessage('diagram.drawio');
		await expect(poHomeChannel.content.btnModalConfirm).not.toBeVisible();
	});

	test('expect not being able to send file when max file size is exceeded', async ({ api, page }) => {
		await setSettingValueById(api, 'FileUpload_MaxFileSize', 1004);

		await page.reload();
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.lastMessageFileName).not.toContainText('any_file1.txt');
	});

	test('Upload file exceeding message characters limit', async ({ api, page }) => {
		const charactersLimit = 100;
		await setSettingValueById(api, 'Message_MaxAllowedSize', charactersLimit);

		await page.reload();

		await test.step('expect showing an error message when description is too long', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.descriptionInput.fill(faker.string.alpha(101));
			await poHomeChannel.content.btnModalConfirm.click();
			await expect(page.getByText(`Cannot upload file, ${charactersLimit} description character limit exceeded`)).toBeVisible();
		});

		await test.step('expect send file when description is edited to not exceed limit', async () => {
			await poHomeChannel.content.descriptionInput.fill(faker.string.alpha(99));
			await poHomeChannel.content.btnModalConfirm.click();
			await expect(poHomeChannel.content.btnModalConfirm).not.toBeVisible();
		});
	});
});

test.describe('file-upload-not-member', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('expect not be able to upload if not a member', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
	});
});
