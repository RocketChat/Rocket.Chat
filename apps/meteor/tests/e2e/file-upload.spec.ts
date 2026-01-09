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
		await poHomeChannel.navbar.openChat(targetChannel);
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

	test.describe.serial('multiple file upload', () => {
		test('should send multiple files successfully', async () => {
			const file1 = 'any_file.txt';
			const file2 = 'lst-test.lst';

			await poHomeChannel.content.sendFileMessage(file1);
			await poHomeChannel.content.sendFileMessage(file2);

			await poHomeChannel.content.btnSendMainComposer.click();

			await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file1);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file2);
		});

		test('should be able to remove file from composer before sending', async () => {
			const file1 = 'any_file.txt';
			const file2 = 'lst-test.lst';

			await poHomeChannel.content.sendFileMessage(file1);
			await poHomeChannel.content.sendFileMessage(file2);

			await poHomeChannel.content.getFileComposerByName(file1).getByRole('button', { name: 'Close' }).click();

			await expect(poHomeChannel.content.getFileComposerByName(file1)).not.toBeVisible();
			await expect(poHomeChannel.content.getFileComposerByName(file2)).toBeVisible();

			await poHomeChannel.content.btnSendMainComposer.click();

			await expect(poHomeChannel.content.lastUserMessage).not.toContainText(file1);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file2);
		});

		test('should send multiple files with text message successfully', async () => {
			const file1 = 'any_file.txt';
			const file2 = 'lst-test.lst';
			const message = 'Here are two files';

			await poHomeChannel.content.sendFileMessage(file1);
			await poHomeChannel.content.sendFileMessage(file2);
			await poHomeChannel.content.inputMessage.fill(message);

			await poHomeChannel.content.btnSendMainComposer.click();

			await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file1);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file2);
		});

		test('should respect the maximum number of files allowed per message: 10', async () => {
			const file11 = 'number6.png';
			const files = new Array(10).fill('number1.png');

			await Promise.all([...files, file11].map((file) => poHomeChannel.content.sendFileMessage(file)));

			// TODO: Composer regorg is needed for it to be accessible and allow locating files by their extensions and counting them
			// await expect(poHomeChannel.content.getFilesInComposer('.png')).toHaveCount(10);
			await expect(poHomeChannel.content.getFileComposerByName(file11)).not.toBeVisible();
		});
	});

	test.describe.serial('file upload fails', () => {
		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream');
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml');
		});

		test('should open warning modal when all file uploads fail', async () => {
			const invalidFile1 = 'empty_file.txt';
			const invalidFile2 = 'diagram.drawio';

			await poHomeChannel.content.sendFileMessage(invalidFile1, { waitForResponse: false });
			await poHomeChannel.content.sendFileMessage(invalidFile2, { waitForResponse: false });

			await expect(poHomeChannel.content.getFileComposerByName(invalidFile1)).toHaveAttribute('readonly');
			await expect(poHomeChannel.content.getFileComposerByName(invalidFile2)).toHaveAttribute('readonly');

			await poHomeChannel.content.btnSendMainComposer.click();
			const warningModal = poHomeChannel.page.getByRole('dialog', { name: 'Warning' });
			await expect(warningModal).toBeVisible();
			await expect(warningModal).toContainText('2 files failed to upload');
			await expect(warningModal.getByRole('button', { name: 'Ok' })).toBeVisible();
			await expect(warningModal.getByRole('button', { name: 'Send anyway' })).not.toBeVisible();
		});

		test('should handle multiple files with one failing upload', async () => {
			const validFile = 'any_file.txt';
			const invalidFile = 'empty_file.txt';

			await test.step('should only mark as "Upload failed" the specific file that failed to upload', async () => {
				await poHomeChannel.content.sendFileMessage(validFile, { waitForResponse: false });
				await poHomeChannel.content.sendFileMessage(invalidFile, { waitForResponse: false });

				await expect(poHomeChannel.content.getFileComposerByName(validFile)).not.toHaveAttribute('readonly');
				await expect(poHomeChannel.content.getFileComposerByName(invalidFile)).toHaveAttribute('readonly');
			});

			await test.step('should open warning modal', async () => {
				await poHomeChannel.content.btnSendMainComposer.click();

				const warningModal = poHomeChannel.page.getByRole('dialog', { name: 'Are you sure' });
				await expect(warningModal).toBeVisible();
				await expect(warningModal).toContainText('One file failed to upload');
			});

			await test.step('should close modal when clicking "Cancel" button', async () => {
				const warningModal = poHomeChannel.page.getByRole('dialog', { name: 'Are you sure' });
				await warningModal.getByRole('button', { name: 'Cancel' }).click();

				await expect(warningModal).not.toBeVisible();
				await expect(poHomeChannel.content.getFileComposerByName(invalidFile)).toBeVisible();
				await expect(poHomeChannel.content.getFileComposerByName(validFile)).toBeVisible();
			});

			await test.step('should send message with the valid file when confirming "Send anyway"', async () => {
				await poHomeChannel.content.btnSendMainComposer.click();

				const warningModal = poHomeChannel.page.getByRole('dialog', { name: 'Are you sure' });

				await warningModal.getByRole('button', { name: 'Send anyway' }).click();

				await expect(warningModal).not.toBeVisible();
				await expect(poHomeChannel.content.lastMessageFileName).toContainText(validFile);
				await expect(poHomeChannel.content.getFileComposerByName(invalidFile)).not.toBeVisible();
			});
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
		await poHomeChannel.navbar.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('should not be able to upload if not a member', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();

		await expect(poHomeChannel.content.getFileComposerByName('any_file.txt')).not.toBeVisible();
	});
});
