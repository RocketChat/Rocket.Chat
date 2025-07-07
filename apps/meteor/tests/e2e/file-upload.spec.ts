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
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('should successfully cancel upload', async () => {
		const fileName = 'any_file.txt';
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.getFileComposerByName(fileName).getByRole('button', { name: 'Close' }).click();

		await expect(poHomeChannel.content.getFileComposerByName(fileName)).not.toBeVisible();
	});

	test('should not display modal when clicking in send file', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.getFileComposerByName('any_file.txt').click();
		await poHomeChannel.content.btnCancelUpdateFileUpload.click();
		await expect(poHomeChannel.content.fileUploadModal).not.toBeVisible();
	});

	test('should send file with name updated', async () => {
		const updatedFileName = 'any_file1.txt';
		await poHomeChannel.content.dragAndDropTxtFile();

		await test.step('update file name and send', async () => {
			await poHomeChannel.content.getFileComposerByName('any_file.txt').click();
			await poHomeChannel.content.inputFileUploadName.fill(updatedFileName);
			await poHomeChannel.content.btnUpdateFileUpload.click();

			expect(poHomeChannel.content.getFileComposerByName(updatedFileName));
			await poHomeChannel.content.btnSendMainComposer.click();
		});

		await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
		await expect(poHomeChannel.content.lastMessageFileName).toContainText(updatedFileName);
	});

	test('should send lst file successfully', async () => {
		await poHomeChannel.content.dragAndDropLstFile();
		await poHomeChannel.content.btnSendMainComposer.click();

		await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('lst-test.lst');
	});

	test('should send drawio (unknown media type) file successfully', async ({ page }) => {
		const fileName = 'diagram.drawio';
		await page.reload();
		await poHomeChannel.content.sendFileMessage(fileName);
		await poHomeChannel.content.btnSendMainComposer.click();

		await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
		await expect(poHomeChannel.content.lastMessageFileName).toContainText(fileName);
	});

	test('should not to send drawio file (unknown media type) when the default media type is blocked', async ({ api, page }) => {
		const fileName = 'diagram.drawio';
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream');

		await page.reload();
		await poHomeChannel.content.sendFileMessage(fileName, { waitForResponse: false });

		await expect(poHomeChannel.content.getFileComposerByName(fileName)).toHaveAttribute('readonly');
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

	test('should not be able to upload if not a member', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();

		await expect(poHomeChannel.content.getFileComposerByName('any_file.txt')).not.toBeVisible();
	});
});
