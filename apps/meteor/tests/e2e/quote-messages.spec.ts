import { faker } from '@faker-js/faker';
import type { Page } from 'playwright-core';

import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
import { expect, test, type BaseTest } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Quote Messages', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string; // Keeps the name for UI navigation
	let targetChannelId: string; // NEW: Stores the ID for API calls
	let page: Page;

	test.beforeAll(async ({ browser, api }) => {
		targetChannel = await createTargetChannel(api);

		// NEW: Fetch the channel ID so our API helpers can use it
		const infoResponse = await api.get(`/channels.info?roomName=${targetChannel}`);
		const infoData = await infoResponse.json();
		targetChannelId = infoData.channel._id;

		const context = await browser.newContext();
		page = await context.newPage();
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
		await poHomeChannel.navbar.openChat(targetChannel);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/channels.delete', { roomName: targetChannel })).status()).toBe(200);
		await page.close(); // Clean up our shared page
	});

	// --- API Helpers for Fast Test Setup ---
	const seedMessageViaApi = async (api: any, roomId: string, text: string, threadId?: string) => {
		const payload: any = { message: { rid: roomId, msg: text } };
		if (threadId) payload.message.tmid = threadId;
		const response = await api.post('/chat.sendMessage', payload);
		const data = await response.json();

		if (!data.success) throw new Error(`API Error: ${JSON.stringify(data)}`); // Better error logging!
		return data.message._id;
	};

	const createDiscussionViaApi = async (api: BaseTest['api'], parentRoomId: string, parentMessageId: string, name: string) => {
		const response = await api.post('/rooms.createDiscussion', {
			prid: parentRoomId,
			pmid: parentMessageId,
			t_name: name,
		});
		const data = await response.json();
		return data.discussion._id;
	};

	const createDMViaApi = async (api: BaseTest['api'], username: string) => {
		const response = await api.post('/im.create', { username });
		const data = await response.json();
		return data.room._id;
	};

	test('should quote a message containing plain text, emoji, markdown, and code blocks', async () => {
		const messageText = faker.lorem.sentence();
		const quoteText = `Quote with :smile:, *bold*, _italics_, and \`\`\`javascript\nconsole.log("Hello");\n\`\`\``;

		await test.step('Send initial message and quote it with complex formatting', async () => {
			await poHomeChannel.content.sendMessage(messageText);
			await poHomeChannel.content.quoteMessage(quoteText, messageText);
		});

		await test.step('Verify quoted message and all formatting appears', async () => {
			const lastMessage = poHomeChannel.content.lastUserMessage;
			await expect(lastMessage).toBeVisible();
			await expect(lastMessage.locator('blockquote')).toBeVisible();

			// Verify content and formatting
			await expect(lastMessage).toContainText('Quote with');
			await expect(lastMessage.locator('strong')).toBeVisible();
			await expect(lastMessage.locator('em')).toBeVisible();
			await expect(lastMessage).toContainText('console.log');

			await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(messageText);
		});
	});

	test('should edit a quoted message', async () => {
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
			await poHomeChannel.composer.inputMessage.fill(editedQuoteText);
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

	test('should quote message in Direct Message', async ({ api }) => {
		const messageText = faker.lorem.sentence();
		const quoteText = faker.lorem.sentence();

		await test.step('Setup DM and initial message via API', async () => {
			const dmRoomId = await createDMViaApi(api, Users.user1.data.username);
			await seedMessageViaApi(api, dmRoomId, messageText);
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
			// Use targetChannelId instead of targetChannel
			const parentMsgId = await seedMessageViaApi(api, targetChannelId, originalMessage);
			const discussionRoomId = await createDiscussionViaApi(api, targetChannelId, parentMsgId, discussionName);
			await seedMessageViaApi(api, discussionRoomId, discussionMessage);
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
			const dmRoomId = await createDMViaApi(api, Users.user1.data.username);
			const parentMsgId = await seedMessageViaApi(api, dmRoomId, messageText);
			await seedMessageViaApi(api, dmRoomId, threadMessage, parentMsgId);
		});

		await test.step('Open DM thread and quote message', async () => {
			// Re-open chat to ensure clean state and fresh data fetch
			await poHomeChannel.navbar.openChat(Users.user1.data.username);
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
