import { expect, test, Browser, Page } from '@playwright/test';

import { validUserInserted } from './utils/mocks/userAndPasswordMock';
import { Auth, HomeChannel } from './page-objects';

async function createAuxContext(browser: Browser): Promise<{ page: Page; pageHomeChannel: HomeChannel }> {
	const page = await browser.newPage();
	const pageAuth = new Auth(page);
	const pageHomeChannel = new HomeChannel(page);

	await pageAuth.doLogin(validUserInserted);

	return { page, pageHomeChannel };
}

test.describe('Messaging', () => {
	let pageAuth: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeEach(async ({ page }) => {
		pageAuth = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
	});

	test.beforeEach(async () => {
		await pageAuth.doLogin();
	});

	test('expect show "hello word" in both contexts (general)', async ({ browser }) => {
		await pageHomeChannel.sidenav.doOpenChat('general');
		await pageHomeChannel.content.doSendMessage('hello world');

		const auxContext = await createAuxContext(browser);
		await auxContext.pageHomeChannel.sidenav.doOpenChat('general');

		await expect(auxContext.pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

		await auxContext.page.close();
	});

	test('expect show "hello word" in both contexts (room_private_1)', async ({ browser }) => {
		await pageHomeChannel.sidenav.doOpenChat('room_private_1');
		await pageHomeChannel.content.doSendMessage('hello world');

		const auxContext = await createAuxContext(browser);
		await auxContext.pageHomeChannel.sidenav.doOpenChat('room_private_1');

		await expect(auxContext.pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

		await auxContext.page.close();
	});

	test('expect show "hello word" in both contexts (direct)', async ({ browser }) => {
		await pageHomeChannel.sidenav.doOpenChat('user.name.test');
		await pageHomeChannel.content.doSendMessage('hello world');

		const auxContext = await createAuxContext(browser);
		await auxContext.pageHomeChannel.sidenav.doOpenChat('rocketchat.internal.admin.test');

		await expect(auxContext.pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');
		await expect(pageHomeChannel.content.lastUserMessage.locator('p')).toHaveText('hello world');

		await auxContext.page.close();
	});

	test.describe('File Upload', async () => {
		test.beforeEach(async () => {
			await pageHomeChannel.sidenav.doOpenChat('general');
			await pageHomeChannel.content.doDragAndDropFile();
		});

		test('expect not show modal after click in cancel button', async () => {
			await pageHomeChannel.content.modalCancelButton.click();
			await expect(pageHomeChannel.content.modalFilePreview).not.toBeVisible();
		});

		test('expect send file not show modal', async () => {
			await pageHomeChannel.content.buttonSend.click();
			await expect(pageHomeChannel.content.modalFilePreview).not.toBeVisible();
		});

		test('expect send file with description', async () => {
			await pageHomeChannel.content.descriptionInput.type('any_description');
			await pageHomeChannel.content.buttonSend.click();
			await expect(pageHomeChannel.content.getFileDescription).toHaveText('any_description');
		});

		test('expect send file with different file name', async () => {
			await pageHomeChannel.content.fileNameInput.fill('any_file1.txt');
			await pageHomeChannel.content.buttonSend.click();
			await expect(pageHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
		});
	});

	test.describe('Messaging actions', async () => {
		test.beforeEach(async () => {
			await pageHomeChannel.sidenav.doOpenChat('general');
		});

		test('expect reply the message', async ({ page }) => {
			await pageHomeChannel.content.doSendMessage('This is a message for reply');
			await pageHomeChannel.content.doOpenMessageActionMenu();
			await pageHomeChannel.content.doSelectAction('reply');
			await pageHomeChannel.tabs.messageInput.type('this is a reply message');
			await page.keyboard.press('Enter');
			await expect(pageHomeChannel.tabs.flexTabViewThreadMessage).toHaveText('this is a reply message');
			await pageHomeChannel.tabs.closeThreadMessage.click();
		});

		test('expect edit the message', async () => {
			await pageHomeChannel.content.doSendMessage('This is a message to edit');
			await pageHomeChannel.content.doOpenMessageActionMenu();
			await pageHomeChannel.content.doSelectAction('edit');
		});

		test('expect message is deleted', async () => {
			await pageHomeChannel.content.doSendMessage('Message to delete');
			await pageHomeChannel.content.doOpenMessageActionMenu();
			await pageHomeChannel.content.doSelectAction('delete');
		});

		test('it should quote the message', async () => {
			const message = `Message for quote - ${Date.now()}`;

			await pageHomeChannel.content.doSendMessage(message);
			await pageHomeChannel.content.doOpenMessageActionMenu();
			await pageHomeChannel.content.doSelectAction('quote');

			await expect(pageHomeChannel.content.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
		});

		test('it should star the message', async () => {
			await pageHomeChannel.content.doSendMessage('Message to star');
			await pageHomeChannel.content.doOpenMessageActionMenu();
			await pageHomeChannel.content.doSelectAction('star');
		});

		test('it should copy the message', async () => {
			await pageHomeChannel.content.doSendMessage('Message to copy');
			await pageHomeChannel.content.doOpenMessageActionMenu();
			await pageHomeChannel.content.doSelectAction('copy');
		});

		test('it should permalink the message', async () => {
			await pageHomeChannel.content.doSendMessage('Message to permalink');
			await pageHomeChannel.content.doOpenMessageActionMenu();
			await pageHomeChannel.content.doSelectAction('permalink');
		});
	});
});
