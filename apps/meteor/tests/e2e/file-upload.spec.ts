import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { FileUploadWarningModal } from './page-objects/fragments/modals';
import { createTargetChannel } from './utils';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test as baseTest } from './utils/test';

type FileUploadFixtures = {
	targetChannel: string;
	poHomeChannel: HomeChannel;
};

const test = baseTest.extend<FileUploadFixtures>({
	targetChannel: async ({ api }, use) => {
		const channel = await createTargetChannel(api, { members: ['user1'] });
		await use(channel);
		await api.post('/channels.delete', { roomName: channel });
	},
	poHomeChannel: async ({ page, targetChannel }, use) => {
		const poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.navbar.openChat(targetChannel);
		await use(poHomeChannel);
	},
});

test.use({ storageState: Users.user1.state });

const TEST_FILE_TXT = 'any_file.txt';
const TEST_FILE_LST = 'lst-test.lst';
const TEST_FILE_DRAWIO = 'diagram.drawio';
const TEST_EMPTY_FILE = 'empty_file.txt';

test.describe('file-upload', () => {
	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml');
	});

	test('Standard File Upload Operations', async ({ page, poHomeChannel, context }) => {
		await test.step('should cancel uploaded file attached to message composer', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.composer.removeFileByName(TEST_FILE_TXT);
			await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toBeVisible();
		});

		await test.step('update file name and send', async () => {
			const updatedFileName = `edited_${TEST_FILE_TXT}`;
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.composer.getFileByName(TEST_FILE_TXT).click();
			await poHomeChannel.content.inputFileUploadName.fill(updatedFileName);
			await poHomeChannel.content.btnUpdateFileUpload.click();

			await poHomeChannel.composer.btnSend.click();
			await expect(poHomeChannel.content.getLastMessageByFileName(updatedFileName)).toContainText(updatedFileName);
		});

		await test.step('should attach multiple files and send one per message', async () => {
			await poHomeChannel.content.dragAndDropTxtFile();
			await poHomeChannel.content.dragAndDropLstFile();
			await poHomeChannel.composer.btnSend.click();

			await expect(poHomeChannel.content.lastUserMessageDownloadLink).toHaveCount(1);
		});

		await test.step('should not be able to attach files when editing a message', async () => {
			await poHomeChannel.content.sendMessage('message to be edited');
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionEditMessage.click();

			await poHomeChannel.content.dragAndDropTxtFile({ waitForResponse: false });
			await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toBeVisible();

			await page.keyboard.press('Escape');
			await expect(poHomeChannel.composer.inputMessage).toBeVisible();
		});

		await test.step('should upload file in composer after recording video message', async () => {
			await context.grantPermissions(['camera', 'microphone']);
			await poHomeChannel.composer.btnVideoMessage.click();
			await poHomeChannel.composer.videoRecorderPopup.record();
			await expect(poHomeChannel.composer.getFileByName('Video record.webm')).toBeVisible();

			await poHomeChannel.composer.removeFileByName('Video record.webm');
		});

		await test.step('should be able to remove file from thread composer before sending', async () => {
			await poHomeChannel.content.sendMessage('this is a message for thread reply');
			await poHomeChannel.content.openReplyInThread();
			await poHomeChannel.content.sendFileMessageToThread(TEST_FILE_TXT);
			await poHomeChannel.content.sendFileMessageToThread(TEST_FILE_LST);

			await poHomeChannel.threadComposer.removeFileByName(TEST_FILE_LST);

			await expect(poHomeChannel.threadComposer.getFileByName(TEST_FILE_TXT)).toBeVisible();
			await expect(poHomeChannel.threadComposer.getFileByName(TEST_FILE_LST)).not.toBeVisible();
		});
	});
});

test.describe('file upload fails', () => {
	let fileUploadWarningModal: FileUploadWarningModal;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'application/octet-stream');
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'FileUpload_MediaTypeBlackList', 'image/svg+xml');
	});

	test('File Rejection & Warning Modal Journey', async ({ page, poHomeChannel }) => {
		fileUploadWarningModal = new FileUploadWarningModal(page.getByRole('dialog'));

		await test.step('should not send drawio file when media type is blocked', async () => {
			await poHomeChannel.content.sendFileMessage(TEST_FILE_DRAWIO, { waitForResponse: false });

			await expect(poHomeChannel.composer.getFileByName(TEST_FILE_DRAWIO)).toHaveAttribute('readonly', '');
			await poHomeChannel.composer.removeFileByName(TEST_FILE_DRAWIO);
			await expect(poHomeChannel.composer.getFileByName(TEST_FILE_DRAWIO)).not.toBeVisible();
		});

		await test.step('should handle multiple files with one failing upload', async () => {
			await poHomeChannel.content.sendFileMessage(TEST_FILE_TXT, { waitForResponse: false });
			await poHomeChannel.content.sendFileMessage(TEST_EMPTY_FILE, { waitForResponse: false });

			await expect(poHomeChannel.composer.getFileByName(TEST_FILE_TXT)).not.toHaveAttribute('readonly');
			await expect(poHomeChannel.composer.getFileByName(TEST_EMPTY_FILE)).toHaveAttribute('readonly', '');

			await poHomeChannel.composer.btnSend.click();

			await fileUploadWarningModal.waitForDisplay();
			await expect(fileUploadWarningModal.getContent('1 file failed to upload')).toBeVisible();
			await fileUploadWarningModal.cancel();

			await poHomeChannel.composer.btnSend.click();
			await fileUploadWarningModal.confirmSend();
			await expect(poHomeChannel.content.getLastMessageByFileName(TEST_FILE_TXT)).toContainText(TEST_FILE_TXT);
		});
	});
});
