import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannelAndReturnFullRoom, sendMessage } from './utils';
import { test, expect } from './utils/test';
import { uploadFileToRoom } from './utils/uploadFile';

test.use({ storageState: Users.admin.state });
const fileDescription = `Message for quote - ${Date.now()}`;
const quotedMessage = 'Quoting the attachment';
const threadQuoteMessage = 'Quoting in thread';

test.describe.parallel('Quote Attachment', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetChannelId: string;

	test.beforeAll(async ({ api }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api);
		targetChannel = channel.name as string;
		targetChannelId = channel._id;
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
	});

	test('should show file preview and description when quoting a message with attachment', async ({ request }) => {
		const imageFileName = 'test-image.jpeg';
		await test.step('Send message with attachment in the channel', async () => {
			await uploadFileToRoom(request, Users.admin, targetChannelId, imageFileName, { msg: fileDescription });

			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.getFileDescription).toContainText(fileDescription);
		});
		await test.step('Quote the message with attachment', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.btnQuoteMessage.click();

			// Verify the quote preview shows both file and description
			await expect(poHomeChannel.content.quotePreview).toBeVisible();
			await expect(poHomeChannel.content.quotePreview).toContainText(fileDescription);
			await expect(poHomeChannel.content.quotePreview).toContainText(imageFileName);

			// Send the quoted message
			await poHomeChannel.content.sendMessage(quotedMessage);
		});
		await test.step('Verify the quoted message appears correctly', async () => {
			await expect(poHomeChannel.content.quotedFileDescription(fileDescription)).toBeVisible();
			await expect(poHomeChannel.content.quotedFileName(imageFileName)).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(quotedMessage);
		});
	});

	test('should show file preview and description when quoting attachment file within a thread', async ({ api, request }) => {
		const textFileName = 'any_file.txt';

		await test.step('Create thread and send message with attachment', async () => {
			const tmid = await sendMessage(api, targetChannelId, 'Initial message for thread test');
			await uploadFileToRoom(request, Users.admin, targetChannelId, textFileName, { msg: fileDescription, tmid });
			await poHomeChannel.gotoChannelThread(targetChannel, tmid);

			await expect(poHomeChannel.content.lastThreadMessageFileDescription).toHaveText(fileDescription);
			await expect(poHomeChannel.content.getLastThreadMessageByFileName(textFileName)).toBeVisible();
		});

		await test.step('Quote the message with attachment in thread', async () => {
			await poHomeChannel.content.lastUserThreadMessage.hover();
			await poHomeChannel.content.btnQuoteMessage.click();

			// Verify the quote preview shows both file and description
			await expect(poHomeChannel.content.threadQuotePreview).toBeVisible();
			await expect(poHomeChannel.content.threadQuotePreview).toContainText(fileDescription);
			await expect(poHomeChannel.content.threadQuotePreview).toContainText(textFileName);

			// Send the quoted message in thread
			await poHomeChannel.content.sendMessageInThread(threadQuoteMessage);
			await poHomeChannel.content.threadQuotePreview.waitFor({ state: 'hidden' });
		});

		await test.step('Verify the quoted message appears correctly in thread', async () => {
			await expect(poHomeChannel.content.lastUserThreadMessage).toBeVisible();
			await expect(poHomeChannel.content.threadMessageQuotedFileDescription(fileDescription)).toBeVisible();
			await expect(poHomeChannel.content.threadMessageQuotedFileName(textFileName)).toBeVisible();
			await expect(poHomeChannel.content.lastUserThreadMessage).toContainText(threadQuoteMessage);
		});
	});

	test('should show link preview when quoting a link with preview', async ({ api }) => {
		const testLink = 'https://rocket.chat';

		await test.step('Send link message in channel', async () => {
			await sendMessage(api, targetChannelId, testLink);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(testLink);
			await expect(poHomeChannel.content.linkPreview).toBeVisible();
		});

		await test.step('Quote the link message', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.btnQuoteMessage.click();

			// Verify the quote preview shows the link
			await expect(poHomeChannel.content.quotePreview).toBeVisible();
			await expect(poHomeChannel.content.quotePreview).toContainText(testLink);

			// Send the quoted message
			await poHomeChannel.content.sendMessage(quotedMessage);
		});

		await test.step('Verify the quoted message appears correctly', async () => {
			await expect(poHomeChannel.content.quotedLinkText(testLink)).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(quotedMessage);
		});
	});
});
