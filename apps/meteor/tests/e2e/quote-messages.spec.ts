import { faker } from '@faker-js/faker';
import type { Page, BrowserContext } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, sendMessage, createDiscussion, createDirectMessageRoom } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Quote Messages', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let targetChannelId: string;
	let page: Page;
	let context: BrowserContext;

	test.beforeAll(async ({ browser, api }) => {
		targetChannel = await createTargetChannel(api);

		const infoResponse = await api.get(`/channels.info?roomName=${targetChannel}`);
		const infoData = await infoResponse.json();

		if (!infoResponse.ok() || !infoData?.channel?._id) {
			throw new Error(
				`Channel lookup failed for "${targetChannel}". Status: ${infoResponse.status()}, Response Body: ${JSON.stringify(infoData)}`,
			);
		}

		targetChannelId = infoData.channel._id;

		context = await browser.newContext();
		page = await context.newPage();
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.navbar.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
		await page.close();
		await context.close();
	});

	test('should quote a message containing plain text, emoji, markdown, and code blocks', async ({ api }) => {
		const messageText = faker.lorem.sentence();
		const quoteText = `Quote with :smile:, *bold*, _italics_, and \`\`\`javascript\nconsole.log("Hello");\n\`\`\``;

		await test.step('Send initial message via API and quote it', async () => {
			await sendMessage(api, targetChannelId, messageText);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message and all formatting appears', async () => {
			const lastMessage = poHomeChannel.content.lastUserMessage;
			await expect(lastMessage).toBeVisible();
			await expect(lastMessage.locator('blockquote')).toBeVisible();
			await expect(lastMessage).toContainText('Quote with');
			await expect(lastMessage.locator('strong')).toBeVisible();
			await expect(lastMessage.locator('em')).toBeVisible();
			await expect(lastMessage).toContainText('console.log');
			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(messageText);
		});
	});

	test('should edit a quoted message', async ({ api }) => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();
		const editedQuoteText = faker.lorem.sentence();

		await test.step('Send initial message via API and quote it', async () => {
			await sendMessage(api, targetChannelId, messageText);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Edit the quoted message', async () => {
			await poHomeChannel.content.lastUserMessage.hover();
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionEditMessage.click();
			await poHomeChannel.composer.inputMessage.fill(editedQuoteText);
			await page.keyboard.press('Enter');
		});

		await test.step('Verify edited message appears', async () => {
			await expect(poHomeChannel.content.lastUserMessage).toContainText(editedQuoteText);
			await expect(poHomeChannel.content.lastUserMessage).not.toContainText(quoteText);
		});
	});

	test('should delete a quoted message', async ({ api }) => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Send initial message via API and quote it', async () => {
			await sendMessage(api, targetChannelId, messageText);
			await expect(poHomeChannel.content.lastUserMessage).toContainText(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Delete the quoted message', async () => {
			await poHomeChannel.content.deleteLastMessage();
		});

		await test.step('Verify message is deleted', async () => {
			await expect(poHomeChannel.content.lastUserMessage).not.toContainText(quoteText);
		});
	});

	test('should cancel quote preview', async ({ api }) => {
		const messageText = faker.lorem.sentence();

		await test.step('Send initial message via API', async () => {
			await sendMessage(api, targetChannelId, messageText);
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

	test('should quote message in Direct Message', async ({ api }) => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Setup DM and initial message via API', async () => {
			const dmRoomId = await createDirectMessageRoom(api, Users.user1.data.username);
			await sendMessage(api, dmRoomId, messageText);
		});

		await test.step('Open DM and quote message', async () => {
			await poHomeChannel.navbar.openChat(Users.user1.data.username);
			await expect(poHomeChannel.content.channelHeader).toContainText(Users.user1.data.username);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message appears in DM', async () => {
			const lastMessage = poHomeChannel.content.lastUserMessage;
			await expect(lastMessage).toBeVisible();
			await expect(lastMessage.locator('blockquote')).toBeVisible();
			await expect(lastMessage).toContainText(quoteText);
			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(messageText);
		});
	});

	test('should quote message in Discussion', async ({ api }) => {
		const originalMessage = faker.lorem.sentence();
		const discussionMessage = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();
		const discussionName = `Discussion-${Date.now()}`;

		await test.step('Setup Discussion and messages via API', async () => {
			const parentMsgId = await sendMessage(api, targetChannelId, originalMessage);
			const discussionRoomId = await createDiscussion(api, targetChannelId, parentMsgId, discussionName);
			await sendMessage(api, discussionRoomId, discussionMessage);
		});

		await test.step('Open discussion and quote message', async () => {
			await poHomeChannel.navbar.openChat(discussionName);
			await expect(poHomeChannel.content.channelHeader).toContainText(discussionName);
			await poHomeChannel.content.quoteMessage(quoteText, discussionMessage);
		});

		await test.step('Verify quoted message appears in discussion', async () => {
			const lastMessage = poHomeChannel.content.lastUserMessage;
			await expect(lastMessage).toBeVisible();
			await expect(lastMessage.locator('blockquote')).toBeVisible();
			await expect(lastMessage).toContainText(quoteText);
			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(discussionMessage);
		});
	});

	test('should quote message with thread in DM', async ({ api }) => {
		const messageText = faker.lorem.sentence();
		const threadMessage = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Setup DM thread and messages via API', async () => {
			const dmRoomId = await createDirectMessageRoom(api, Users.user2.data.username);
			const parentMsgId = await sendMessage(api, dmRoomId, messageText);
			await sendMessage(api, dmRoomId, threadMessage, parentMsgId);
		});

		await test.step('Open DM thread and quote message', async () => {
			await poHomeChannel.navbar.openChat(Users.user2.data.username);
			await poHomeChannel.content.openReplyInThread();

			await poHomeChannel.content.lastUserThreadMessage.hover();
			await poHomeChannel.content.btnQuoteMessage.click();
			await expect(poHomeChannel.content.threadQuotePreview).toBeVisible();
			await poHomeChannel.content.sendMessageInThread(quoteText);
		});

		await test.step('Verify quoted message appears in DM thread', async () => {
			const lastThreadMessage = poHomeChannel.content.lastUserThreadMessage;
			await expect(lastThreadMessage).toBeVisible();
			await expect(lastThreadMessage.locator('blockquote')).toBeVisible();
			await expect(lastThreadMessage).toContainText(quoteText);
		});
	});
});
