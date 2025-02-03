import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';
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
		await page.goto('/home');
		await poHomeChannel.sidenav.openChat(targetChannel);
	});
	test('expect thread message preview if alsoSendToChannel checkbox is checked', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply');
		await page.locator('[data-qa-type="message"]').last().hover();
		await page.locator('role=button[name="Reply in thread"]').click();

		await expect(page).toHaveURL(/.*thread/);

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);
		await page.getByRole('dialog').locator('[name="msg"]').last().fill('This is a thread message also sent in channel');
		await page.keyboard.press('Enter');
		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
		await expect(poHomeChannel.content.lastUserMessage).toContainText('This is a thread message also sent in channel');
	});
	test('expect open threads contextual bar when clicked on thread preview', async ({ page }) => {
		await poHomeChannel.content.lastThreadMessagePreviewText.click();
		await expect(page).toHaveURL(/.*thread/);
		await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
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
		test('expect to close thread contextual bar on clicking outside', async ({ page }) => {
			await poHomeChannel.content.lastThreadMessagePreviewText.click();
			await expect(page).toHaveURL(/.*thread/);
			await poHomeChannel.content.lastUserMessageNotThread.click();
			await expect(page).not.toHaveURL(/.*thread/);
		});
		test('expect open threads contextual bar when clicked on thread preview', async ({ page }) => {
			await poHomeChannel.content.lastThreadMessagePreviewText.click();
			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
		});
		test('expect not to close thread contextual bar when performing some action', async ({ page }) => {
			await poHomeChannel.content.lastThreadMessagePreviewText.click();
			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');

			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('role=menuitem[name="Copy text"]').click();

			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
		});
	});
	test('expect upload a file attachment in thread with description', async ({ page }) => {
		await poHomeChannel.content.lastThreadMessagePreviewText.click();

		await expect(page).toHaveURL(/.*thread/);

		await poHomeChannel.content.dragAndDropTxtFileToThread();
		await poHomeChannel.content.descriptionInput.fill('any_description');
		await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
		await poHomeChannel.content.btnModalConfirm.click();

		await expect(poHomeChannel.content.lastThreadMessageFileDescription).toHaveText('any_description');
		await expect(poHomeChannel.content.lastThreadMessageFileName).toContainText('any_file1.txt');
	});

	test.describe('thread message actions', () => {
		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);
			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await page.locator('[data-qa-type="message"]').last().hover();
			await page.locator('role=button[name="Reply in thread"]').click();
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
			await page.getByRole('dialog').locator('[data-qa-type="message"]').last().hover();
			await page.locator('role=button[name="Quote"]').click();
			await page.locator('[name="msg"]').last().fill('this is a quote message');
			await page.keyboard.press('Enter');

			await expect(poHomeChannel.content.lastThreadMessageTextAttachmentEqualsText).toContainText('this is a message for reply');
		});

		test('expect star the thread message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('role=menuitem[name="Star"]').click();
			await page.getByRole('button').and(page.getByTitle('Options')).click();
			await page.locator('[data-key="starred-messages"]').click();
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
			await expect(page.getByRole('dialog').locator('[data-qa-type="message"]')).toBeVisible();
			await expect(page.locator('[name="msg"]').last()).toBeFocused();
			await page.keyboard.press('Escape');
			await expect(page).not.toHaveURL(/.*thread/);
		});

		test('expect reset the thread composer to original message if user presses escape', async ({ page }) => {
			await expect(page).toHaveURL(/.*thread/);
			await expect(page.getByRole('dialog').locator('[data-qa-type="message"]')).toBeVisible();

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
			await expect(page.getByRole('dialog').locator('[data-qa-type="message"]')).toBeVisible();
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
