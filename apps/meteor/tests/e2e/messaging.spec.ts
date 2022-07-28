import { expect, test, Browser, Page } from '@playwright/test';

import { HomeChannel } from './page-objects';
import { createTargetChannel } from './utils';

type AuxContext = { page: Page; pageHomeChannel: HomeChannel };

const createAuxContext = async (browser: Browser): Promise<AuxContext> => {
	const page = await browser.newPage({ storageState: 'session.json' });
	const pageHomeChannel = new HomeChannel(page);
	await page.goto('/home');

	return { page, pageHomeChannel };
};

test.use({ storageState: 'session-admin.json' });

test.describe('Messaging', () => {
	let pageHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeEach(async ({ page }) => {
		pageHomeChannel = new HomeChannel(page);
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/home');
	});

	test.beforeAll(async ({ browser }) => {
		targetChannel = await createTargetChannel(browser);
	});

	test.describe('Making conversations', () => {
		test('expect show "hello word" in both contexts (targetChannel)', async ({ browser }) => {
			const auxContext = await createAuxContext(browser);
			await pageHomeChannel.sidenav.openChat(targetChannel);
			await pageHomeChannel.content.sendMessage('hello world');

			await auxContext.pageHomeChannel.sidenav.openChat(targetChannel);

			await expect(auxContext.pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
			await expect(pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

			await auxContext.page.close();
		});

		test('expect show "hello word" in both contexts (direct)', async ({ browser }) => {
			const auxContext = await createAuxContext(browser);
			await pageHomeChannel.sidenav.openChat('user1');
			await pageHomeChannel.content.sendMessage('hello world');

			await auxContext.pageHomeChannel.sidenav.itemDirectMessage('rocketchat.internal.admin.testuser1').click();

			await expect(auxContext.pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
			await expect(pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

			await auxContext.page.close();
		});
	});

	test.describe('File Upload', async () => {
		test.beforeEach(async () => {
			await pageHomeChannel.sidenav.openChat(targetChannel);
			await pageHomeChannel.content.dragAndDropFile();
		});

		test('expect not show modal after click in cancel button', async () => {
			await pageHomeChannel.content.btnModalCancel.click();
			await expect(pageHomeChannel.content.modalFilePreview).not.toBeVisible();
		});

		test('expect send file not show modal', async () => {
			await pageHomeChannel.content.btnModalConfirm.click();
			await expect(pageHomeChannel.content.modalFilePreview).not.toBeVisible();
		});

		test('expect send file with description', async () => {
			await pageHomeChannel.content.descriptionInput.type('any_description');
			await pageHomeChannel.content.btnModalConfirm.click();
			await expect(pageHomeChannel.content.getFileDescription).toHaveText('any_description');
		});

		test('expect send file with different file name', async () => {
			await pageHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await pageHomeChannel.content.btnModalConfirm.click();
			await expect(pageHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
		});
	});

	test.describe('Messaging actions', async () => {
		test.beforeEach(async () => {
			await pageHomeChannel.sidenav.openChat(targetChannel);
		});

		test('expect reply the message', async ({ page }) => {
			await pageHomeChannel.content.sendMessage('This is a message for reply');
			await pageHomeChannel.content.openMessageActionMenu();
			await pageHomeChannel.content.selectAction('reply');
			await page.locator('.rcx-vertical-bar .js-input-message').type('this is a reply message');
			await page.keyboard.press('Enter');
			await expect(pageHomeChannel.tabs.flexTabViewThreadMessage).toHaveText('this is a reply message');
		});

		test('expect edit the message', async () => {
			await pageHomeChannel.content.sendMessage('This is a message to edit');
			await pageHomeChannel.content.openMessageActionMenu();
			await pageHomeChannel.content.selectAction('edit');
		});

		test('expect message is deleted', async () => {
			await pageHomeChannel.content.sendMessage('Message to delete');
			await pageHomeChannel.content.openMessageActionMenu();
			await pageHomeChannel.content.selectAction('delete');
		});

		test('expect quote the message', async () => {
			const message = `Message for quote - ${Date.now()}`;

			await pageHomeChannel.content.sendMessage(message);
			await pageHomeChannel.content.openMessageActionMenu();
			await pageHomeChannel.content.selectAction('quote');

			await expect(pageHomeChannel.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
		});

		test('expect star the message', async () => {
			await pageHomeChannel.content.sendMessage('Message to star');
			await pageHomeChannel.content.openMessageActionMenu();
			await pageHomeChannel.content.selectAction('star');
		});

		test('expect copy the message', async () => {
			await pageHomeChannel.content.sendMessage('Message to copy');
			await pageHomeChannel.content.openMessageActionMenu();
			await pageHomeChannel.content.selectAction('copy');
		});

		test('it should permalink the message', async () => {
			await pageHomeChannel.content.sendMessage('Message to permalink');
			await pageHomeChannel.content.openMessageActionMenu();
			await pageHomeChannel.content.selectAction('permalink');
		});
	});
});
