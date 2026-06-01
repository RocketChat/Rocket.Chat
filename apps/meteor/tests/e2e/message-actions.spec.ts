import { ADMIN_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { CreateNewDiscussionModal } from './page-objects/fragments';
import { createTargetChannel, createTargetTeam, getPermissionRoles, sendTargetChannelMessage } from './utils';
import { setUserPreferences } from './utils/setUserPreferences';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('message-actions', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let forwardChannel: string;
	let forwardTeam: string;
	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api, { members: ['user2'] });
		forwardChannel = await createTargetChannel(api);
		forwardTeam = await createTargetTeam(api);
	});
	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.gotoChannel(targetChannel);
	});

	test('expect reply the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply');
		await poHomeChannel.content.openReplyInThread();
		await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetChannel}"]`).type('this is a reply message');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserThreadMessage).toHaveText('this is a reply message');
	});

	// with thread open we listen to the subscription and update the collection from there
	test('expect follow/unfollow message with thread open', async ({ page }) => {
		await test.step('start thread', async () => {
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.content.openReplyInThread();
			await page.getByRole('dialog').locator(`role=textbox[name="Message #${targetChannel}"]`).fill('this is a reply message');
			await page.keyboard.press('Enter');
			await expect(poHomeChannel.content.lastUserThreadMessage).toHaveText('this is a reply message');
		});

		await test.step('unfollow thread', async () => {
			const unFollowButton = poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Following' });
			await expect(unFollowButton).toBeVisible();

			await unFollowButton.click();
		});

		await test.step('follow thread', async () => {
			const followButton = poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Not following' });
			await expect(followButton).toBeVisible();
			await followButton.click();
			await expect(poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Following' })).toBeVisible();
		});
	});

	// with thread closed we depend on message changed updates
	test('expect follow/unfollow message with thread closed', async ({ page }) => {
		await test.step('start thread', async () => {
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.content.openReplyInThread();
			await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetChannel}"]`).fill('this is a reply message');
			await page.keyboard.press('Enter');
			await expect(poHomeChannel.content.lastUserThreadMessage).toHaveText('this is a reply message');
		});

		// close thread before testing because the behavior changes
		await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

		await test.step('unfollow thread', async () => {
			const unFollowButton = poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Following' });
			await expect(unFollowButton).toBeVisible();
			await unFollowButton.click();
		});

		await test.step('follow thread', async () => {
			const followButton = poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Not following' });
			await expect(followButton).toBeVisible();
			await followButton.click();
			await expect(poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Following' })).toBeVisible();
		});
	});

	test('expect edit the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('This is a message to edit');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Edit"]').click();
		await page.locator('[name="msg"]').fill('this message was edited');
		await page.keyboard.press('Enter');

		await poHomeChannel.content.scrollToMessage(poHomeChannel.content.getMessageByText('this message was edited'), 'down');
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('this message was edited');
	});

	test('should delete message ', async () => {
		await poHomeChannel.content.sendMessage('Message to delete');
		await poHomeChannel.content.deleteLastMessage();

		await expect(poHomeChannel.content.lastUserMessageBody).not.toHaveText('Message to delete');
	});

	test('expect quote the message', async ({ page }) => {
		const message = `Message for quote - ${Date.now()}`;

		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.lastUserMessage.hover();
		await poHomeChannel.content.lastUserMessage.getByRole('button', { name: 'Quote' }).click();
		await page.locator('[name="msg"]').fill('this is a quote message');
		await page.keyboard.press('Enter');

		await poHomeChannel.content.scrollToMessage(poHomeChannel.content.getMessageByText(message), 'down');
		await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(message);
	});

	test('expect create a discussion from message', async ({ page }) => {
		const message = `Message for discussion - ${Date.now()}`;
		const discussionName = `Discussion Name - ${Date.now()}`;

		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Start a Discussion"]').click();
		const createDiscussionModal = new CreateNewDiscussionModal(page);
		const createButton = createDiscussionModal.btnCreate;
		// Name should be prefilled thus making the create button enabled
		await expect(createButton).not.toBeDisabled();
		await createDiscussionModal.inputName.fill(discussionName);
		await createButton.click();
		await expect(page.locator('header h1')).toHaveText(discussionName);
		await poHomeChannel.gotoChannel(targetChannel);
		// Should fail if more than one discussion has been created
		await poHomeChannel.content.scrollToMessage(poHomeChannel.content.getMessageByText(message), 'down');
		await expect(poHomeChannel.content.getMessageByText(discussionName)).toHaveCount(1);
	});

	test('expect star the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to star');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Star"]').click();
		await poHomeChannel.toastMessage.dismissToast();
		await poHomeChannel.roomToolbar.openMoreOptions();
		await poHomeChannel.roomToolbar.menuItemStarredMessages.click();
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('Message to star');
	});

	test('expect copy the message content to clipboard', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await poHomeChannel.content.sendMessage('Message to copy');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Copy text"]').click();

		const clipboardText = await page.evaluate('navigator.clipboard.readText()');
		expect(clipboardText).toBe('Message to copy');
	});

	test('expect copy the message link to clipboard', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await poHomeChannel.content.sendMessage('Message to permalink');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Copy link"]').click();

		const clipboardText = await page.evaluate('navigator.clipboard.readText()');
		expect(clipboardText).toContain('http');
	});

	test.describe.serial('expect reply in direct message', () => {
		test.use({ storageState: Users.user2.state });

		let defaultCreateDRoles: string[];

		test.beforeAll(async ({ api }) => {
			defaultCreateDRoles = await getPermissionRoles(api, 'create-d');

			await sendTargetChannelMessage(api, targetChannel, { msg: 'message from admin for reply in DM' });
		});

		test('expect option be visible and redirect to DM', async ({ page }) => {
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionReplyInDm.click();

			await expect(page).toHaveURL(/.*reply/);
		});

		test('expect option not be visible without create-d permission and no existing DM', async ({ api }) => {
			expect((await api.post('/permissions.update', { permissions: [{ _id: 'create-d', roles: ['admin'] }] })).status()).toBe(200);

			await poHomeChannel.content.openLastMessageMenu();
			await expect(poHomeChannel.content.btnOptionReplyInDm).toBeHidden();
		});

		test.afterAll(async ({ api }) => {
			expect((await api.post('/permissions.update', { permissions: [{ _id: 'create-d', roles: defaultCreateDRoles }] })).status()).toBe(
				200,
			);
		});
	});

	test.describe('Preference Hide Contextual Bar by clicking outside of it Enabled', () => {
		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, { hideFlexTab: true });
		});
		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, { hideFlexTab: false });
		});
		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await poHomeChannel.gotoChannel(targetChannel);
		});
		test('expect reply the message in direct', async ({ page }) => {
			await poHomeChannel.content.sendMessage('this is a message for reply in direct');
			await poHomeChannel.content.openLastMessageMenu();
			await poHomeChannel.content.btnOptionReplyInDm.click();

			await expect(page).toHaveURL(/.*reply/);
		});
	});

	test('expect forward message to channel', async () => {
		const message = 'this is a message to forward to channel';
		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.gotoChannel(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
	});

	test('expect forward message to team', async () => {
		const message = 'this is a message to forward to team';
		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.forwardMessage(forwardTeam);

		await poHomeChannel.navbar.openChat(forwardTeam);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
	});

	test('expect forward message to direct message', async () => {
		const message = 'this is a message to forward to direct message';
		const direct = 'RocketChat Internal Admin Test';

		// todo: Forward modal is using name as display and the sidebar is using username
		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.forwardMessage(direct);

		await poHomeChannel.navbar.openChat(ADMIN_CREDENTIALS.username);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
	});

	test('expect forward text file to channel', async () => {
		const filename = 'any_file.txt';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.gotoChannel(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	});

	test('expect forward image file to channel', async () => {
		const filename = 'test-image.jpeg';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.gotoChannel(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	});

	test('expect forward pdf file to channel', async () => {
		const filename = 'test_pdf_file.pdf';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.gotoChannel(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	});

	test('expect forward audio message to channel', async () => {
		const filename = 'sample-audio.mp3';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.gotoChannel(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	});

	test('expect forward video message to channel', async () => {
		const filename = 'test_video.mp4';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.composer.btnSend.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.gotoChannel(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	});
});
