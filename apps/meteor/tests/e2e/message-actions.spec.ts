import { ADMIN_CREDENTIALS } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, createTargetTeam } from './utils';
import { setUserPreferences } from './utils/setUserPreferences';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });
test.describe.serial('message-actions', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let forwardChannel: string;
	let forwardTeam: string;
	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		forwardChannel = await createTargetChannel(api);
		forwardTeam = await createTargetTeam(api);
	});
	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});
	test('expect reply the message in direct', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply in direct');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Reply in direct message"]').click();

		await expect(page).toHaveURL(/.*reply/);
	});

	test('expect reply the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply');
		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Reply in thread"]').click();
		await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetChannel}"]`).type('this is a reply message');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.tabs.flexTabViewThreadMessage).toHaveText('this is a reply message');
	});
	test('expect edit the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('This is a message to edit');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Edit"]').click();
		await page.locator('[name="msg"]').fill('this message was edited');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('this message was edited');
	});

	test('expect message is deleted', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to delete');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Delete"]').click();
		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();
		await expect(poHomeChannel.content.lastUserMessage.locator('[data-qa-type="message-body"]:has-text("Message to delete")')).toHaveCount(
			0,
		);
	});

	test('expect quote the message', async ({ page }) => {
		const message = `Message for quote - ${Date.now()}`;

		await poHomeChannel.content.sendMessage(message);
		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Quote"]').click();
		await page.locator('[name="msg"]').fill('this is a quote message');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.lastMessageTextAttachmentEqualsText).toHaveText(message);
	});

	test('expect star the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to star');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Star"]').click();
		await poHomeChannel.dismissToast();
		await page.locator('role=button[name="Options"]').click();
		await page.locator('[data-key="starred-messages"]').click();
		await expect(poHomeChannel.content.lastUserMessageBody).toHaveText('Message to star');
	});

	test('expect copy the message content to clipboard', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await poHomeChannel.content.sendMessage('Message to copy');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('role=menuitem[name="Copy text"]').click();

		const clipboardText = await page.evaluate("navigator.clipboard.readText()");
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

	test.describe('Preference Hide Contextual Bar by clicking outside of it Enabled', () => {
		test.beforeAll(async ({ api }) => {
			await setUserPreferences(api, { hideFlexTab: true });
		});
		test.afterAll(async ({ api }) => {
			await setUserPreferences(api, { hideFlexTab: false });
		});
		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(targetChannel);
		});
		test('expect reply the message in direct', async ({ page }) => {
			await poHomeChannel.content.sendMessage('this is a message for reply in direct');
			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('role=menuitem[name="Reply in direct message"]').click();

			await expect(page).toHaveURL(/.*reply/);
		});
	});

	test('expect forward message to channel', async () => {
		const message = 'this is a message to forward to channel';
		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.sidenav.openChat(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
	})

	test('expect forward message to team', async () => {
		const message = 'this is a message to forward to team';
		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.forwardMessage(forwardTeam);

		await poHomeChannel.sidenav.openChat(forwardTeam);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
	})

	test('expect forward message to direct message', async () => {
		const message = 'this is a message to forward to direct message';
		const direct = 'RocketChat Internal Admin Test';

		// todo: Forward modal is using name as display and the sidebar is using username
		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.forwardMessage(direct);

		await poHomeChannel.sidenav.openChat(ADMIN_CREDENTIALS.username);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(message);
	})

	test('expect forward text file to channel', async () => {
		const filename = 'any_file.txt';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.sidenav.openChat(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	})

	test('expect forward image file to channel', async () => {
		const filename = 'test-image.jpeg';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.sidenav.openChat(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	})

	test('expect forward pdf file to channel', async () => {
		const filename = 'test_pdf_file.pdf';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.sidenav.openChat(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	})

	test('expect forward audio message to channel', async () => {
		const filename = 'sample-audio.mp3';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.sidenav.openChat(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	})

	test('expect forward video message to channel', async () => {
		const filename = 'test_video.mp4';
		await poHomeChannel.content.sendFileMessage(filename);
		await poHomeChannel.content.btnModalConfirm.click();
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);

		await poHomeChannel.content.forwardMessage(forwardChannel);

		await poHomeChannel.sidenav.openChat(forwardChannel);
		await expect(poHomeChannel.content.lastUserMessage).toContainText(filename);
	})
});
