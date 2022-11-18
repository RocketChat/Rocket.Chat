import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('message-actions', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
	});

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
		await page.locator('.rcx-vertical-bar .js-input-message').type('another reply message');
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

		await expect(poHomeChannel.content.waitForLastThreadMessageTextAttachmentEqualsText).toContainText('this is a message for reply');
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
		await page.keyboard.press('Escape');

		await expect(page).not.toHaveURL(/.*thread/);
	});
});
