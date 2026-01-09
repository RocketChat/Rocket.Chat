import { faker } from '@faker-js/faker';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Quote Messages', () => {
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

	test('should quote a single message in channel', async () => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Send initial message and quote it', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message appears', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('blockquote')).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(quoteText);
			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(messageText);
		});
	});

	test('should edit a quoted message', async ({ page }) => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();
		const editedQuoteText = faker.lorem.sentence();

		await test.step('Send initial message and quote it', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Edit the quoted message', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionEditMessage.click();
			await poHomeChannel.content.inputMessage.fill(editedQuoteText);
			await page.keyboard.press('Enter');
		});

		await test.step('Verify edited message appears', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toContainText(editedQuoteText);
			await expect(poHomeChannel.content.lastUserMessage).not.toContainText(quoteText);
		});
	});

	test('should delete a quoted message', async () => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Send initial message and quote it', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Delete the quoted message', async () => {
			await poHomeChannel.content.deleteLastMessage();
		});

		await test.step('Verify message is deleted', async () => {
			await expect(poHomeChannel.content.lastUserMessage).not.toContainText(quoteText);
		});
	});

	test('should quote message with emoji', async () => {
		const messageText = faker.lorem.sentence();
		const quoteText = 'Quote with emoji :smile:';

		await test.step('Send initial message and quote it with emoji', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message with emoji appears', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('blockquote')).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText('Quote with emoji');
		});
	});

	test('should quote message with markdown formatting', async () => {
		const messageText = faker.lorem.sentence();
		const quoteText = '*Bold* and _italics_ text';

		await test.step('Send initial message and quote it with markdown formatting', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message with markdown appears', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('blockquote')).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('strong')).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('em')).toBeVisible();
		});
	});

	test('should quote message with code blocks', async () => {
		const messageText = faker.lorem.sentence();
		const quoteText = '```javascript\nconsole.log("Hello World");\n```';

		await test.step('Send initial message and quote it with code block', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message with code block appears', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('blockquote')).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText('console.log');
		});
	});

	test('should cancel quote preview', async () => {
		const messageText = faker.lorem.sentence();

		await test.step('Send initial message', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(messageText);
		});

		await test.step('cancel quote', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.btnQuoteMessage.click();
			await expect(poHomeChannel.content.quotePreview).toBeVisible();
			await poHomeChannel.content.btnCancelQuotePreview.click();
		});

		await test.step('Verify quote preview is cancelled', async () => {
			await expect(poHomeChannel.content.quotePreview).not.toBeVisible();
		});
	});

	test('should quote message in Direct Message', async () => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Open DM with user', async () => {
			await poHomeChannel.navbar.openChat(Users.user1.data.username);
			await expect(poHomeChannel.content.channelHeader).toContainText(Users.user1.data.username);
		});

		await test.step('Send initial message and quote it', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message appears in DM', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('blockquote')).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(quoteText);
			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(messageText);
		});
	});

	test('should quote message in Discussion', async () => {
		const originalMessage = faker.lorem.sentence();
		const discussionName = `Discussion-${Date.now()}`;
		const discussionMessage = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Send original message and create discussion', async () => {
			await poHomeChannel.content.sendMessage(originalMessage);
			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionStartDiscussion.click();
			await poHomeChannel.content.inputDiscussionName.fill(discussionName);
			await poHomeChannel.content.btnCreateDiscussionModal.click();
		});

		await test.step('Send message in discussion', async () => {
			await expect(poHomeChannel.content.channelHeader).toContainText(discussionName);
			await poHomeChannel.content.sendMessage(discussionMessage);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(discussionMessage);
		});

		await test.step('Quote message in discussion', async () => {
			await poHomeChannel.content.quoteMessage(quoteText, discussionMessage);
		});

		await test.step('Verify quoted message appears in discussion', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage.locator('blockquote')).toBeVisible();
			await expect(poHomeChannel.content.lastUserMessage).toContainText(quoteText);
			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(discussionMessage);
		});
	});

	test('should quote message with thread in DM', async ({ page }) => {
		const messageText = faker.lorem.sentence();
		const threadMessage = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Open DM and create thread', async () => {
			await poHomeChannel.navbar.openChat(Users.user1.data.username);
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.openReplyInThread();
			await expect(page).toHaveURL(/.*thread/);
			await poHomeChannel.content.sendMessageInThread(threadMessage);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText(threadMessage);
		});

		await test.step('Quote message in DM thread', async () => {
			await poHomeChannel.content.lastThreadMessageText.hover();
			await poHomeChannel.content.btnQuoteMessage.click();
			await expect(poHomeChannel.content.threadQuotePreview).toBeVisible();
			await expect(poHomeChannel.content.threadQuotePreview).toContainText(threadMessage);
			await poHomeChannel.content.sendMessageInThread(quoteText);
		});

		await test.step('Verify quoted message appears in DM thread', async () => {
			await expect(poHomeChannel.content.lastThreadMessageText).toBeVisible();
			await expect(poHomeChannel.content.lastThreadMessageText.locator('blockquote')).toBeVisible();
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText(quoteText);
		});
	});
});
