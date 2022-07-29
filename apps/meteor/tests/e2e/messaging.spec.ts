import { expect, test, Browser, Page } from '@playwright/test';

import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

const createAuxContext = async (browser: Browser): Promise<{ page: Page; poHomeChannel: HomeChannel }> => {
	const page = await browser.newPage({ storageState: 'session.json' });
	const poHomeChannel = new HomeChannel(page);
	await page.goto('/home');

	return { page, poHomeChannel };
};

test.use({ storageState: 'session-admin.json' });

test.describe('Messaging', () => {
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
		const auxContext = await createAuxContext(browser);
		await poHomeChannel.sidenav.openChat(targetChannel);
		await poHomeChannel.content.sendMessage('hello world');

		await auxContext.poHomeChannel.sidenav.openChat(targetChannel);

		await expect(auxContext.poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

		await auxContext.page.close();
	});

	test('expect show "hello word" in both contexts (direct)', async ({ browser }) => {
		const auxContext = await createAuxContext(browser);
		await poHomeChannel.sidenav.openChat('user1');
		await poHomeChannel.content.sendMessage('hello world');

		await auxContext.poHomeChannel.sidenav.itemDirectMessage('rocketchat.internal.admin.testuser1').click();

		await expect(auxContext.poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(poHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

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
			await poHomeChannel.content.openMessageActionMenu();
			await poHomeChannel.content.selectAction('reply');
			await page.locator('.rcx-vertical-bar .js-input-message').type('this is a reply message');
			await page.keyboard.press('Enter');

			await expect(poHomeChannel.tabs.flexTabViewThreadMessage).toHaveText('this is a reply message');
		});

		test('expect edit the message', async () => {
			await poHomeChannel.content.sendMessage('This is a message to edit');
			await poHomeChannel.content.openMessageActionMenu();
			await poHomeChannel.content.selectAction('edit');
		});

		test('expect message is deleted', async () => {
			await poHomeChannel.content.sendMessage('Message to delete');
			await poHomeChannel.content.openMessageActionMenu();
			await poHomeChannel.content.selectAction('delete');
		});

		test('expect quote the message', async () => {
			const message = `Message for quote - ${Date.now()}`;

			await poHomeChannel.content.sendMessage(message);
			await poHomeChannel.content.openMessageActionMenu();
			await poHomeChannel.content.selectAction('quote');

			await expect(poHomeChannel.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
		});

		test('expect star the message', async () => {
			await poHomeChannel.content.sendMessage('Message to star');
			await poHomeChannel.content.openMessageActionMenu();
			await poHomeChannel.content.selectAction('star');
		});

		test('expect copy the message', async () => {
			await poHomeChannel.content.sendMessage('Message to copy');
			await poHomeChannel.content.openMessageActionMenu();
			await poHomeChannel.content.selectAction('copy');
		});

		test('expect permalink the message', async () => {
			await poHomeChannel.content.sendMessage('Message to permalink');
			await poHomeChannel.content.openMessageActionMenu();
			await poHomeChannel.content.selectAction('permalink');
		});
	});
});
