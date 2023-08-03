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
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="reply-in-thread"]').click();

		await expect(page).toHaveURL(/.*thread/);

		await poHomeChannel.content.toggleAlsoSendThreadToChannel(true);

		await page.locator('//main//aside >> [name="msg"]').last().fill('This is a thread message also sent in channel');
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

			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('[data-qa-id="copy"]').click();

			await expect(page).toHaveURL(/.*thread/);
			await expect(poHomeChannel.content.lastThreadMessageText).toContainText('This is a thread message also sent in channel');
		});
	});

	test.describe('thread message actions', () => {
		test.beforeEach(async ({ page }) => {
			poHomeChannel = new HomeChannel(page);

			await page.goto('/home');
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.sendMessage('this is a message for reply');
			await poHomeChannel.content.openLastMessageMenu();
			await page.locator('[data-qa-id="reply-in-thread"]').click();
		});

		test('expect delete the thread message and close thread if has only one message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await expect(page).toHaveURL(/.*thread/);

			await page.locator('[data-qa-id="delete-message"]').click();
			await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();

			await expect(page).not.toHaveURL(/.*thread/);
		});

		test('expect delete the thread message and keep thread open if has more than one message', async ({ page }) => {
			await page.locator('.rcx-vertical-bar').locator(`role=textbox[name="Message #${targetChannel}"]`).type('another reply message');
			await page.keyboard.press('Enter');

			await poHomeChannel.content.openLastThreadMessageMenu();
			await expect(page).toHaveURL(/.*thread/);

			await page.locator('[data-qa-id="delete-message"]').click();
			await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();

			await expect(page).toHaveURL(/.*thread/);
		});

		test('expect edit the thread message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('[data-qa-id="edit-message"]').click();
			await page.locator('[name="msg"]').last().fill('this message was edited');
			await page.keyboard.press('Enter');
		});

		test('expect quote the thread message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('[data-qa-id="quote-message"]').click();
			await page.locator('[name="msg"]').last().fill('this is a quote message');
			await page.keyboard.press('Enter');

			await expect(poHomeChannel.content.lastThreadMessageTextAttachmentEqualsText).toContainText('this is a message for reply');
		});

		test('expect star the thread message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('[data-qa-id="star-message"]').click();
		});

		test('expect copy the message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('[data-qa-id="copy"]').click();
		});

		test('expect permalink the thread message', async ({ page }) => {
			await poHomeChannel.content.openLastThreadMessageMenu();
			await page.locator('[data-qa-id="permalink"]').click();
		});

		test('expect close thread if has only one message and user press escape', async ({ page }) => {
			await expect(page).toHaveURL(/.*thread/);

			await expect(page.locator('//main//aside >> [data-qa-type="message"]')).toBeVisible();
			await expect(page.locator('[name="msg"]').last()).toBeFocused();
			await page.keyboard.press('Escape');

			await expect(page).not.toHaveURL(/.*thread/);
		});
	});
});
