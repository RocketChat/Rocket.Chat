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
		await setSettingValueById(api, 'FileUpload_MaxFilesPerMessage', 10);
		targetChannel = await createTargetChannel(api, { members: ['user1'] });
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.navbar.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml');
		await setSettingValueById(api, 'FileUpload_MaxFilesPerMessage', 1);
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('should successfully cancel upload', async () => {
		const fileName = 'any_file.txt';
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.composer.removeFileByName(fileName);

		await expect(poHomeChannel.composer.getFileByName(fileName)).not.toBeVisible();
	});

	test('should not display modal when clicking in send file', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.composer.getFileByName('any_file.txt').click();
		await poHomeChannel.content.btnCancelUpdateFileUpload.click();
		await expect(poHomeChannel.content.fileUploadModal).not.toBeVisible();
	});

	test('should send file with name updated', async () => {
		const updatedFileName = 'any_file1.txt';
		await poHomeChannel.content.sendFileMessage('any_file.txt');

		await test.step('update file name and send', async () => {
			await poHomeChannel.composer.getFileByName('any_file.txt').click();
			await poHomeChannel.content.inputFileUploadName.fill(updatedFileName);
			await poHomeChannel.content.btnUpdateFileUpload.click();

			expect(poHomeChannel.composer.getFileByName(updatedFileName));
			await poHomeChannel.composer.btnSend.click();
		});

		await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
		await expect(poHomeChannel.content.lastMessageFileName).toContainText(updatedFileName);
	});

	test('should send lst file successfully', async () => {
		await poHomeChannel.content.dragAndDropLstFile();
		await poHomeChannel.composer.btnSend.click();

		await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
		await expect(poHomeChannel.content.lastMessageFileName).toContainText('lst-test.lst');
	});

	test('should send drawio (unknown media type) file successfully', async ({ page }) => {
		const fileName = 'diagram.drawio';
		await page.reload();
		await poHomeChannel.content.sendFileMessage(fileName);
		await poHomeChannel.composer.btnSend.click();

		await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
		await expect(poHomeChannel.content.lastMessageFileName).toContainText(fileName);
	});

	test('should not to send drawio file (unknown media type) when the default media type is blocked', async ({ api, page }) => {
		const fileName = 'diagram.drawio';
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream');

		await page.reload();
		await poHomeChannel.content.sendFileMessage(fileName, { waitForResponse: false });

		await expect(poHomeChannel.composer.getFileByName(fileName)).toHaveAttribute('readonly');
	});

	test.describe.serial('multiple file upload', () => {
		test('should send multiple files successfully', async () => {
			const file1 = 'any_file.txt';
			const file2 = 'lst-test.lst';

			await poHomeChannel.content.sendFileMessage(file1);
			await poHomeChannel.content.sendFileMessage(file2);

			await poHomeChannel.composer.btnSend.click();

			await expect(poHomeChannel.content.getFileDescription).not.toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file1);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file2);
		});

		test('should be able to remove file from composer before sending', async () => {
			const file1 = 'any_file.txt';
			const file2 = 'lst-test.lst';

			await poHomeChannel.content.sendFileMessage(file1);
			await poHomeChannel.content.sendFileMessage(file2);

			await poHomeChannel.composer.removeFileByName(file1);

			await expect(poHomeChannel.composer.getFileByName(file1)).not.toBeVisible();
			await expect(poHomeChannel.composer.getFileByName(file2)).toBeVisible();

			await poHomeChannel.composer.btnSend.click();

			await expect(poHomeChannel.content.lastUserMessage).not.toContainText(file1);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file2);
		});

		test('should send multiple files with text message successfully', async () => {
			const file1 = 'any_file.txt';
			const file2 = 'lst-test.lst';
			const message = 'Here are two files';

			await poHomeChannel.content.sendFileMessage(file1);
			await poHomeChannel.content.sendFileMessage(file2);
			await poHomeChannel.composer.inputMessage.fill(message);

			await poHomeChannel.composer.btnSend.click();

			await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file1);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(file2);
		});

		test('should respect the maximum number of files allowed per message: 10', async () => {
			const file11 = 'number6.png';
			const files = new Array(10).fill('number1.png');

			await Promise.all(files.map((file) => poHomeChannel.content.sendFileMessage(file)));
			await poHomeChannel.content.sendFileMessage(file11);

			await expect(poHomeChannel.composer.getFilesInComposer()).toHaveCount(10);
			await expect(poHomeChannel.composer.getFileByName(file11)).not.toBeVisible();
		});
	});

	test.describe.serial('thread multifile upload', () => {
		test('should be able to remove file from thread composer before sending', async () => {
			await poHomeChannel.content.sendMessage('this is a message for thread reply');
			await poHomeChannel.content.openReplyInThread();
			await poHomeChannel.content.sendFileMessageToThread('any_file.txt');
			await poHomeChannel.content.sendFileMessageToThread('another_file.txt');

			await poHomeChannel.threadComposer.removeFileByName('another_file.txt');

			await expect(poHomeChannel.threadComposer.getFileByName('any_file.txt')).toBeVisible();
			await expect(poHomeChannel.threadComposer.getFileByName('another_file.txt')).not.toBeVisible();
		});

		test('should send multiple files in a thread successfully', async () => {
			const message = 'Here are two files in thread';
			await poHomeChannel.content.openReplyInThread();
			await poHomeChannel.content.sendFileMessageToThread('any_file.txt');
			await poHomeChannel.content.sendFileMessageToThread('another_file.txt');

			await poHomeChannel.threadComposer.inputMessage.fill(message);
			await poHomeChannel.threadComposer.btnSend.click();

			await expect(poHomeChannel.content.lastThreadMessageText).toContainText(message);
			await expect(poHomeChannel.content.lastThreadMessageText.getByRole('link').getByText('another_file.txt')).toBeVisible();
			await expect(poHomeChannel.content.lastThreadMessageText.getByRole('link').getByText('any_file.txt')).toBeVisible();
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

			await expect(poHomeChannel.composer.getFileByName(invalidFile1)).toHaveAttribute('readonly');
			await expect(poHomeChannel.composer.getFileByName(invalidFile2)).toHaveAttribute('readonly');

			await poHomeChannel.composer.btnSend.click();
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

				await expect(poHomeChannel.composer.getFileByName(validFile)).not.toHaveAttribute('readonly');
				await expect(poHomeChannel.composer.getFileByName(invalidFile)).toHaveAttribute('readonly');
			});

			await test.step('should open warning modal', async () => {
				await poHomeChannel.composer.btnSend.click();

				const warningModal = poHomeChannel.page.getByRole('dialog', { name: 'Are you sure' });
				await expect(warningModal).toBeVisible();
				await expect(warningModal).toContainText('One file failed to upload');
			});

			await test.step('should close modal when clicking "Cancel" button', async () => {
				const warningModal = poHomeChannel.page.getByRole('dialog', { name: 'Are you sure' });
				await warningModal.getByRole('button', { name: 'Cancel' }).click();

				await expect(warningModal).not.toBeVisible();
				await expect(poHomeChannel.composer.getFileByName(invalidFile)).toBeVisible();
				await expect(poHomeChannel.composer.getFileByName(validFile)).toBeVisible();
			});

			await test.step('should send message with the valid file when confirming "Send anyway"', async () => {
				await poHomeChannel.composer.btnSend.click();

				const warningModal = poHomeChannel.page.getByRole('dialog', { name: 'Are you sure' });

				await warningModal.getByRole('button', { name: 'Send anyway' }).click();

				await expect(warningModal).not.toBeVisible();
				await expect(poHomeChannel.composer.getFileByName(validFile)).not.toBeVisible();
				await expect(poHomeChannel.content.lastMessageFileName).toContainText(validFile);
				await expect(poHomeChannel.composer.getFileByName(invalidFile)).not.toBeVisible();
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

		await expect(poHomeChannel.composer.getFileByName('any_file.txt')).not.toBeVisible();
	});
});
