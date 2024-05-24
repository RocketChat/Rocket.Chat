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
		await Promise.all([
			setSettingValueById(api, 'FileUpload_UnknownMediaTypeProtection', true),
			setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml'),
		]);
		targetChannel = await createTargetChannel(api);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([
			setSettingValueById(api, 'FileUpload_UnknownMediaTypeProtection', true),
			setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml'),
		]);
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

	test('expect not to send drawio file when the "Reject unknown media types" setting is enabled', async ({ api, page }) => {
		await setSettingValueById(api, 'FileUpload_UnknownMediaTypeProtection', true);

		await page.reload();
		await poHomeChannel.content.sendFileMessage('diagram.drawio');
		await expect(poHomeChannel.content.btnModalConfirm).not.toBeVisible();
	});

	test('expect send drawio file succesfully when the "Reject unknown media types" setting is disabled', async ({ api, page }) => {
		await setSettingValueById(api, 'FileUpload_UnknownMediaTypeProtection', false);

		await page.reload();
		await poHomeChannel.content.sendFileMessage('diagram.drawio');
		await poHomeChannel.content.descriptionInput.fill('drawio_description');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('drawio_description');
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('diagram.drawio');
	});

	test('expect not to send drawio file when the "Reject unknown media types" setting is disabled, but the default media type is blocked', async ({ api, page }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream')
		await setSettingValueById(api, 'FileUpload_UnknownMediaTypeProtection', false);

		await page.reload();
		await poHomeChannel.content.sendFileMessage('diagram.drawio');
		await expect(poHomeChannel.content.btnModalConfirm).not.toBeVisible();
	});
});
