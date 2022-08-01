import { Browser, Page } from '@playwright/test';

import { expect, test } from './utils/test';
import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

const createAuxContext = async (browser: Browser): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState: 'user2-session.json' });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/home');

	return { page, poHomeChannel };
};

test.use({ storageState: 'user1-session.json' });

test.describe.serial('Messaging', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ browser }) => {
		targetChannel = await createTargetChannel(browser);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('expect show "hello word" in both contexts (targetChannel)', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello world');

		const auxContext = await createAuxContext(browser);
		await auxContext.poHomeChannel.sidenav.openChat(targetChannel);

		await expect(auxContext.poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

		await auxContext.page.close();
	});

	test('expect show "hello word" in both contexts (direct)', async ({ browser }) => {
		await poHomeChannel.sidenav.openChat('user2');
		await poHomeChannel.content.sendMessage('hello world');

		const auxContext = await createAuxContext(browser);
		await auxContext.poHomeChannel.sidenav.openChat('user1');

		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(auxContext.poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

		await auxContext.page.close();
	});

	test.describe('File Upload', async () => {
		test.beforeEach(async () => {
			await poHomeChannel.sidenav.openChat(targetChannel);
			await poHomeChannel.content.dragAndDropFile();
		});

		test('expect not show modal after click in cancel button', async () => {
			await poHomeChannel.content.btnModalCancel.click();
			await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
		});

		test('expect send file not show modal', async () => {
			await poHomeChannel.content.btnModalConfirm.click();
			await expect(poHomeChannel.content.modalFilePreview).not.toBeVisible();
		});

		test('expect send file with description', async () => {
			await poHomeChannel.content.descriptionInput.type('any_description');
			await poHomeChannel.content.btnModalConfirm.click();
			await expect(poHomeChannel.content.getFileDescription).toHaveText('any_description');
		});

		test('expect send file with different file name', async () => {
			await poHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await poHomeChannel.content.btnModalConfirm.click();
			await expect(poHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
		});
	});

	test.describe('Messaging actions', async () => {
		test.beforeEach(async () => {
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
			await page.locator('[name="msg"]').type('this is a quote message');
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
});
