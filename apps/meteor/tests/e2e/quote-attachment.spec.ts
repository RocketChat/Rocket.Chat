import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });
const fileDescription = `Message for quote - ${Date.now()}`;
const quotedMessage = 'Quoting the attachment';
const threadQuoteMessage = 'Quoting in thread';

test.describe('Quote Attachment', () => {
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

	test('should show file preview and description when quoting a message with attachment', async ({ page }) => {
		await test.step('Send message with attachment in the channel', async () => {
			await poHomeChannel.content.sendFileMessage('test-image.jpeg');
			await poHomeChannel.content.fileNameInput.fill('test-image.jpeg');
			await poHomeChannel.content.descriptionInput.fill(fileDescription);
			await poHomeChannel.content.btnModalConfirm.click();

			// Wait for the file to be uploaded and message to be sent
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.getFileDescription).toContainText(fileDescription);
		});
		await test.step('Quote the message with attachment', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.btnQuoteMessage.click();

			// Verify the quote preview shows both file and description
			await expect(poHomeChannel.content.quotePreview).toBeVisible();
			await expect(poHomeChannel.content.quotePreview.getByTitle('test-image.jpeg')).toBeVisible();
			await expect(poHomeChannel.content.quotePreview.getByText(fileDescription)).toBeVisible();

			// Send the quoted message
			await poHomeChannel.content.inputMessage.fill(quotedMessage);
			await page.keyboard.press('Enter');
		});
		await test.step('Verify the quoted message appears correctly', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(fileDescription);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(quotedMessage);
		});
	});

	test('should quote attachment file within a thread', async ({ page }) => {
		await test.step('Send initial message in channel', async () => {
			await poHomeChannel.content.sendMessage('Initial message for thread test');
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
		});

		await test.step('Create thread and send message with attachment', async () => {
			// Open thread
			await poHomeChannel.content.openReplyInThread();
			// Send file in thread
			await expect(page).toHaveURL(/.*thread/);

			await poHomeChannel.content.dragAndDropTxtFileToThread();
			await poHomeChannel.content.descriptionInput.fill(fileDescription);
			await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await poHomeChannel.content.btnModalConfirm.click();

			await expect(poHomeChannel.content.lastThreadMessageFileDescription).toHaveText(fileDescription);
			await expect(poHomeChannel.content.lastThreadMessageFileName).toContainText('any_file1.txt');
		});

		await test.step('Quote the message with attachment in thread', async () => {
			await poHomeChannel.content.lastThreadMessageText.hover();
			await poHomeChannel.content.btnQuoteMessage.click();

			// Verify the quote preview shows both file and description
			await expect(poHomeChannel.content.threadQuotePreview).toBeVisible();
			await expect(poHomeChannel.content.threadQuotePreview.getByTitle('any_file1.txt')).toBeVisible();
			await expect(poHomeChannel.content.threadQuotePreview.getByText(fileDescription)).toBeVisible();

			// Send the quoted message in thread
			await poHomeChannel.content.inputThreadMessage.fill(threadQuoteMessage);
			await page.keyboard.press('Enter');
		});

		await test.step('Verify the quoted message appears correctly in thread', async () => {
			await expect(poHomeChannel.content.lastThreadMessageText).toBeVisible();
			await expect(poHomeChannel.content.lastThreadMessageTextAttachmentEqualsText).toContainText(fileDescription);
			await expect(poHomeChannel.content.lastThreadMessageFileName).toHaveText('any_file1.txt');
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText(threadQuoteMessage);
		});
	});
});
