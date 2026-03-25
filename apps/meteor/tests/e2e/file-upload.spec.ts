import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { FileUploadWarningModal } from './page-objects/fragments/modals';
import { createTargetChannel } from './utils';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

const TEST_FILE_TXT = 'any_file.txt';
const TEST_FILE_LST = 'lst-test.lst';
const TEST_FILE_DRAWIO = 'diagram.drawio';
const TEST_EMPTY_FILE = 'empty_file.txt';

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

	test('should cancel uploaded file attached to message composer', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.composer.removeFileByName(TEST_FILE_TXT);

		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toBeVisible();
	});

	test('should send file with name updated', async () => {
		const updatedFileName = `edited_${TEST_FILE_TXT}`;
		await poHomeChannel.content.dragAndDropTxtFile();

		await test.step('update file name and send', async () => {
			await poHomeChannel.composer.getFileByName(TEST_FILE_TXT).click();
			await poHomeChannel.content.inputFileUploadName.fill(updatedFileName);
			await poHomeChannel.content.btnUpdateFileUpload.click();

			await expect(poHomeChannel.composer.getFileByName(updatedFileName)).toBeVisible();
			await poHomeChannel.composer.btnSend.click();
		});

		await expect(poHomeChannel.content.getLastMessageByFileName(updatedFileName)).toContainText(updatedFileName);
	});

	test('should attach multiple files and send one per message', async () => {
		await poHomeChannel.content.dragAndDropTxtFile();
		await poHomeChannel.content.dragAndDropLstFile();

		await expect(poHomeChannel.composer.inputMessage).toBeFocused();
		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).toBeVisible();
		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_LST)).toBeVisible();

		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.lastUserMessageDownloadLink).toHaveCount(1);
	});

	test('should not be able to attach files when editing a message', async () => {
		await poHomeChannel.content.sendMessage('message to be edited');
		await poHomeChannel.content.openLastMessageMenu();
		await poHomeChannel.content.btnOptionEditMessage.click();

		await poHomeChannel.content.dragAndDropTxtFile({ waitForResponse: false });
		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toBeVisible();
	});

	test('should send lst file successfully', async () => {
		await poHomeChannel.content.dragAndDropLstFile();
		await poHomeChannel.composer.inputMessage.fill('lst_description');
		await poHomeChannel.composer.btnSend.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('lst_description');
		await expect(poHomeChannel.content.getLastMessageByFileName(TEST_FILE_LST)).toBeVisible();
	});

	test('should send drawio (unknown media type) file successfully', async ({ page }) => {
		await page.reload();
		await poHomeChannel.content.sendFileMessage(TEST_FILE_DRAWIO);
		await poHomeChannel.composer.inputMessage.fill('drawio_description');
		await poHomeChannel.composer.btnSend.click();

		await expect(poHomeChannel.content.getFileDescription).toHaveText('drawio_description');
		await expect(poHomeChannel.content.getLastMessageByFileName(TEST_FILE_DRAWIO)).toBeVisible();
	});

	test('should not to send drawio file (unknown media type) when the default media type is blocked', async ({ api, page }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream');

		await page.reload();
		await poHomeChannel.content.sendFileMessage(TEST_FILE_DRAWIO, { waitForResponse: false });

		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_DRAWIO)).toHaveAttribute('readonly');
	});

	test('should be able to remove file from composer before sending', async () => {
		await poHomeChannel.content.sendFileMessage(TEST_FILE_TXT);
		await poHomeChannel.content.sendFileMessage(TEST_FILE_LST);

		await poHomeChannel.composer.removeFileByName(TEST_FILE_TXT);

		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toBeVisible();
		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_LST)).toBeVisible();

		await poHomeChannel.composer.btnSend.click();

		await expect(poHomeChannel.content.lastUserMessage).not.toContainText(TEST_FILE_TXT);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(TEST_FILE_LST);
	});

	test('should respect the maximum number of files allowed per message: 10', async () => {
		const files = new Array(10).fill('number1.png');

		await Promise.all(files.map((file) => poHomeChannel.content.sendFileMessage(file)));
		await poHomeChannel.content.dragAndDropTxtFile({ waitForResponse: false });

		await expect(poHomeChannel.composer.getFilesInComposer()).toHaveCount(10);
		await expect(poHomeChannel.composer.getFileByName('any_file.txt')).not.toBeVisible();
	});

	test.describe.serial('thread multiple file upload', () => {
		test('should be able to remove file from thread composer before sending', async () => {
			await poHomeChannel.content.sendMessage('this is a message for thread reply');
			await poHomeChannel.content.openReplyInThread();
			await poHomeChannel.content.sendFileMessageToThread(TEST_FILE_TXT);
			await poHomeChannel.content.sendFileMessageToThread(TEST_FILE_LST);

			await poHomeChannel.threadComposer.removeFileByName(TEST_FILE_LST);

			await expect(poHomeChannel.threadComposer.getFileByName(TEST_FILE_TXT)).toBeVisible();
			await expect(poHomeChannel.threadComposer.getFileByName(TEST_FILE_LST)).not.toBeVisible();
		});
	});

	test.describe.serial('file upload fails', () => {
		let fileUploadWarningModal: FileUploadWarningModal;

		test.beforeAll(async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream');
		});

		test.afterAll(async ({ api }) => {
			await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml');
		});

		test('should open warning modal when all file uploads fail', async ({ page }) => {
			fileUploadWarningModal = new FileUploadWarningModal(page.getByRole('dialog', { name: 'Warning' }));

			await poHomeChannel.content.sendFileMessage(TEST_EMPTY_FILE, { waitForResponse: false });
			await poHomeChannel.content.sendFileMessage(TEST_FILE_DRAWIO, { waitForResponse: false });

			await expect(poHomeChannel.composer.getFileByName(TEST_EMPTY_FILE)).toHaveAttribute('readonly');
			await expect(poHomeChannel.composer.getFileByName(TEST_FILE_DRAWIO)).toHaveAttribute('readonly');

			await poHomeChannel.composer.btnSend.click();
			await fileUploadWarningModal.waitForDisplay();

			await expect(fileUploadWarningModal.getContent('2 files failed to upload')).toBeVisible();
			await expect(fileUploadWarningModal.btnOk).toBeVisible();
			await expect(fileUploadWarningModal.btnSendAnyway).not.toBeVisible();
		});

		test('should handle multiple files with one failing upload', async ({ page }) => {
			fileUploadWarningModal = new FileUploadWarningModal(page.getByRole('dialog', { name: 'Are you sure' }));

			await test.step('should only mark as "Upload failed" the specific file that failed to upload', async () => {
				await poHomeChannel.content.sendFileMessage(TEST_FILE_TXT, { waitForResponse: false });
				await poHomeChannel.content.sendFileMessage(TEST_EMPTY_FILE, { waitForResponse: false });

				await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toHaveAttribute('readonly');
				await expect(poHomeChannel.composer.getFileByName(TEST_EMPTY_FILE)).toHaveAttribute('readonly');
			});

			await test.step('should open warning modal', async () => {
				await poHomeChannel.composer.btnSend.click();
				await fileUploadWarningModal.waitForDisplay();

				await expect(fileUploadWarningModal.getContent('One file failed to upload')).toBeVisible();
			});

			await test.step('should close modal when clicking "Cancel" button', async () => {
				await fileUploadWarningModal.cancel();

				await expect(poHomeChannel.composer.getFileByName(TEST_EMPTY_FILE)).toBeVisible();
				await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).toBeVisible();
			});

			await test.step('should send message with the valid file when confirming "Send anyway"', async () => {
				await poHomeChannel.composer.btnSend.click();
				await fileUploadWarningModal.confirmSend();

				await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toBeVisible();
				await expect(poHomeChannel.content.getLastMessageByFileName(TEST_FILE_TXT)).toContainText(TEST_FILE_TXT);
				await expect(poHomeChannel.composer.getFileByName(TEST_EMPTY_FILE)).not.toBeVisible();
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
		await poHomeChannel.content.dragAndDropTxtFile({ waitForResponse: false });
		await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toBeVisible();
	});
});
