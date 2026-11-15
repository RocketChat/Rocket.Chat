import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetChannelAndReturnFullRoom, deleteChannel, markRoomAsRead, sendMessage } from './utils';
import { sendFillerMessages } from './utils/sendMessage';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('Threads', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});
	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel);
	});

	test.afterAll(async ({ api }) => deleteChannel(api, targetChannel));

	test('expect no unread banner when replying to a thread in a fresh channel', async ({ page }) => {
		await poHomeChannel.content.sendMessage('parent for unread-banner test');
		await poHomeChannel.content.openReplyInThread();
		await poHomeChannel.content.sendMessageInThread('first thread reply');

		await page.waitForTimeout(200);
		await expect(page.getByTitle('Mark as read')).not.toBeVisible();
	});

	test('expect thread message preview if alsoSendToChannel checkbox is checked', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply');
		await poHomeChannel.content.openReplyInThread();

		await expect(page).toHaveURL(/.*thread/);

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
		await page.getByRole('dialog').locator('[name="msg"]').last().fill('This is a thread message also sent in channel');
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastUserThreadMessage).toContainText('This is a thread message also sent in channel');
		await expect(poHomeChannel.content.lastThreadMessagePreview).toContainText('This is a thread message also sent in channel');
	});
	test.describe('hideFlexTab Preference enabled for threads', () => {
		test.beforeAll(async ({ api }) => {
			await expect(
				(await api.post('/users.setPreferences', { userId: 'rocketchat.internal.admin.test', data: { hideFlexTab: true } })).status(),
			).toBe(200);
		});
		test.afterAll(async ({ api }) => {
			await expect(
				(await api.post('/users.setPreferences', { userId: 'rocketchat.internal.admin.test', data: { hideFlexTab: false } })).status(),
			).toBe(200);
		});
		test('should close thread contextual bar on clicking outside of it', async ({ page }) => {
			await test.step('open threads contextual bar when clicked on thread preview', async () => {
				await poHomeChannel.content.lastThreadMessagePreviewText.click();
				await expect(page).toHaveURL(/.*thread/);
				await expect(poHomeChannel.content.lastUserThreadMessage).toContainText('This is a thread message also sent in channel', {
					timeout: 15_000,
				});
			});
			await expect(page).not.toHaveURL(/[?&]msg=/);

			await poHomeChannel.content.lastUserMessage.click();
			await expect(page).not.toHaveURL(/.*thread/);
		});
		test('expect not to close thread contextual bar when performing some action', async ({ page }) => {
			await poHomeChannel.content.lastThreadMessagePreviewText.click();
			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastUserThreadMessage).toContainText('This is a thread message also sent in channel', {
				timeout: 15_000,
			});

			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('role=menuitem[name="Copy text"]').click();

			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastUserThreadMessage).toContainText('This is a thread message also sent in channel');
		});
	});
	test('should send a file with name updated in thread', async ({ page }) => {
		const updatedFileName = 'any_file1.txt';
		await poHomeChannel.content.lastThreadMessagePreviewText.click();

		await expect(page).toHaveURL(/.*thread/);

		await poHomeChannel.content.dragAndDropTxtFileToThread();
		await poHomeChannel.threadComposer.getFileByName('any_file.txt').click();
		await poHomeChannel.content.inputFileUploadName.fill(updatedFileName);
		await poHomeChannel.content.btnUpdateFileUpload.click();
		await poHomeChannel.threadComposer.inputMessage.fill('any_description');
		await poHomeChannel.threadComposer.btnSend.click();

		await expect(poHomeChannel.content.lastThreadMessageFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.getLastThreadMessageByFileName(updatedFileName)).toBeVisible();
	});

	test.describe('thread message actions', () => {
		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await poHomeChannel.gotoChannel(targetChannel);
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.content.openReplyInThread();
		});

		test('expect delete the thread message and close thread if has only one message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await expect(page).toHaveURL(/.*thread/);

			await page.locator('role=menuitem[name="Delete"]').click();
			await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();

			await expect(page).not.toHaveURL(/.*thread/);
		});
		test('expect delete the thread message and keep thread open if has more than one message', async ({ page }) => {
			await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetChannel}"]`).type('another reply message');
			await page.keyboard.press('Enter');
			await poHomeChannel.content.openLastThreadMessageMenu();
			await expect(page).toHaveURL(/.*thread/);

			await page.locator('role=menuitem[name="Delete"]').click();
			await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();

			await expect(page).toHaveURL(/.*thread/);
		});

		test('expect edit the thread message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('role=menuitem[name="Edit"]').click();
			await page.locator('[name="msg"]').last().fill('this message was edited');
			await page.keyboard.press('Enter');
			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('this message was edited');
		});

		test('expect quote the thread message', async ({ page }) => {
			await poHomeChannel.content.lastUserThreadMessage.hover();
			await poHomeChannel.content.lastUserThreadMessage.getByRole('button', { name: 'Quote' }).click();
			await page.locator('[name="msg"]').last().fill('this is a quote message');
			await page.keyboard.press('Enter');

			await expect(poHomeChannel.content.lastThreadMessageTextAttachmentEqualsText).toContainText('this is a message for reply');
		});

		test('expect star the thread message', async () => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await poHomeChannel.content.btnOptionStarMessage.click();
			await poHomeChannel.content.btnToolbarOptions.click();
			await poHomeChannel.content.starredMessagesMenuOption.click();

			await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('this is a message for reply');
		});

		test('expect copy the thread message content to clipboard', async ({ page, context }) => {
			await context.grantPermissions(['clipboard-read', 'clipboard-write']);
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('role=menuitem[name="Copy text"]').click();

			const clipboardText = await page.evaluate('navigator.clipboard.readText()');
			expect(clipboardText).toBe('this is a message for reply');
		});

		test('expect copy the thread message link to clipboard', async ({ page, context }) => {
			await context.grantPermissions(['clipboard-read', 'clipboard-write']);
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('role=menuitem[name="Copy link"]').click();

			const clipboardText = await page.evaluate('navigator.clipboard.readText()');
			expect(clipboardText).toContain('http');
		});

		test('expect close thread if has only one message and user press escape', async ({ page }) => {
			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastUserThreadMessage).toBeVisible();
			await expect(page.locator('[name="msg"]').last()).toBeFocused();
			await page.keyboard.press('Escape');
			await expect(page).not.toHaveURL(/.*thread/);
		});

		test('expect reset the thread composer to original message if user presses escape', async ({ page }) => {
			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastUserThreadMessage).toBeVisible();

			await expect(page.locator('[name="msg"]').last()).toBeFocused();
			await page.locator('[name="msg"]').last().fill('message to be edited');
			await page.keyboard.press('Enter');
			await page.keyboard.press('ArrowUp');

			await expect(page.locator('[name="msg"]').last()).toHaveValue('message to be edited');
			await page.locator('[name="msg"]').last().fill('this message was edited');

			await page.keyboard.press('Escape');
			await expect(page.locator('[name="msg"]').last()).toHaveValue('message to be edited');
			await expect(page).toHaveURL(/.*thread/);
		});

		test('expect clean composer and keep the thread open if user is editing message and presses escape', async ({ page }) => {
			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastUserThreadMessage).toBeVisible();
			await expect(page.locator('[name="msg"]').last()).toBeFocused();

			await page.locator('[name="msg"]').last().fill('message to be edited');
			await page.keyboard.press('Enter');

			await page.keyboard.press('ArrowUp');
			await expect(page.locator('[name="msg"]').last()).toHaveValue('message to be edited');

			await page.keyboard.press('Escape');
			await expect(page.locator('[name="msg"]').last()).toHaveValue('');
			await expect(page).toHaveURL(/.*thread/);
		});
	});
});

test.describe.serial('Threads - small screens', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: { name: string; _id: string };

	test.beforeAll(async ({ api }) => {
		const { channel } = await createTargetChannelAndReturnFullRoom(api);
		targetChannel = { name: channel.name as string, _id: channel._id };

		await sendFillerMessages(api, targetChannel._id, 120);
		const parentId = await sendMessage(api, targetChannel._id, 'thread parent');
		await sendMessage(api, targetChannel._id, 'thread reply', parentId);
		// Without this the room opens at the first unread message and loads the whole history at
		// once, leaving no older page for the hidden list to drain.
		await markRoomAsRead(api, targetChannel._id);
	});

	test.afterAll(async ({ api }) => deleteChannel(api, targetChannel.name));

	test('should not load older messages while the message list is hidden behind the full-width thread view', async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel.name);
		// Below the "sm" breakpoint (600px) the contextual bar takes the full room width and the
		// message list is hidden behind it while staying mounted.
		await page.setViewportSize({ width: 599, height: 700 });

		await poHomeChannel.content.mainMessageListScroller.hover();
		await page.mouse.wheel(0, -100);

		// Role-based locators cannot see the list once it is display:none — count DOM nodes instead
		// (thread messages carry a different aria-roledescription, so they never match).
		const mainMessageListItems = page.locator('[role="listitem"][aria-roledescription="message"]');
		const loadedMessages = await mainMessageListItems.count();
		// 121 user messages were seeded — an unloaded older page must remain or there is nothing to drain
		expect(loadedMessages).toBeLessThan(121);

		await poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'View thread' }).click();
		await expect(page).toHaveURL(/.*thread/);
		await expect(poHomeChannel.content.lastUserThreadMessage).toContainText('thread reply');
		await expect(poHomeChannel.content.mainMessageListScroller).toBeHidden();

		// A hidden-history drain re-triggers ~every 100ms, so with 71 older messages unloaded it pushes
		// the count past 100 within the first sample. Hide-transition jitter can at most re-render the
		// single already-loaded 50-message page, which stays under the +50 margin — the two outcomes
		// cannot overlap.
		for (let i = 0; i < 5; i++) {
			await page.waitForTimeout(500);
			expect(await mainMessageListItems.count()).toBeLessThan(loadedMessages + 50);
		}
	});
});
