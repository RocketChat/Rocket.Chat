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
	});

	test('expect reply the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('this is a message for reply');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="reply-in-thread"]').click();
		await page.locator('.rcx-vertical-bar .js-input-message').type('this is a reply message');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.tabs.flexTabViewThreadMessage).toHaveText('this is a reply message');
	});

	test('expect edit the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('This is a message to edit');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="edit-message"]').click();
		await page.locator('[name="msg"]').fill('this message was edited');
		await page.keyboard.press('Enter');
	});

	test('expect message is deleted', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to delete');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="delete-message"]').click();
		await page.locator('#modal-root .rcx-button-group--align-end .rcx-button--danger').click();
	});

	test('expect quote the message', async ({ page }) => {
		const message = `Message for quote - ${Date.now()}`;

		await poHomeChannel.content.sendMessage(message);
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="quote-message"]').click();
		await page.locator('[name="msg"]').fill('this is a quote message');
		await page.keyboard.press('Enter');

		await expect(poHomeChannel.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
	});

	test('expect star the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to star');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="star-message"]').click();
	});

	test('expect copy the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to copy');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="copy"]').click();
	});

	test('expect permalink the message', async ({ page }) => {
		await poHomeChannel.content.sendMessage('Message to permalink');
		await poHomeChannel.content.openLastMessageMenu();
		await page.locator('[data-qa-id="permalink"]').click();
	});
});
