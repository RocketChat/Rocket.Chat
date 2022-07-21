import { expect, test, Browser, Page } from '@playwright/test';

import { validUserInserted } from './utils/mocks/userAndPasswordMock';
import { Auth, HomeChannel } from './page-objects';

const createBrowserContextForChat = async (browser: Browser): Promise<{ page: Page; pageHomeChannel: HomeChannel }> => {
	const page = await browser.newPage();
	const pageLogin = new Auth(page);
	const pageHomeChannel = new HomeChannel(page);
	await pageLogin.doLogin(validUserInserted);

	return { page, pageHomeChannel };
};

test.describe('Messaging', () => {
	let page: Page;
	let pageLogin: Auth;
	let pageHomeChannel: HomeChannel;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageLogin = new Auth(page);
		pageHomeChannel = new HomeChannel(page);
	});

	test.beforeAll(async () => {
		await pageLogin.doLogin();
	});

	test.describe('Normal messaging', async () => {
		let anotherContext: { page: Page; pageHomeChannel: HomeChannel };

		test.describe('General channel', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.pageHomeChannel.sidenav.doOpenChat('general');
				await anotherContext.pageHomeChannel.content.doSendMessage('Hello');
				await pageHomeChannel.sidenav.doOpenChat('general');
				await pageHomeChannel.content.doSendMessage('Hello');
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = page.locator('[data-qa-type="message"][data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('[data-qa-type="message"][data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});
		test.describe('Public channel', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.pageHomeChannel.sidenav.doOpenChat('public channel');
				await anotherContext.pageHomeChannel.content.doSendMessage('Hello');
				await pageHomeChannel.sidenav.doOpenChat('public channel');
				await pageHomeChannel.content.doSendMessage('Hello');
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = page.locator('[data-qa-type="message"][data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('[data-qa-type="message"][data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('Private channel', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.pageHomeChannel.sidenav.doOpenChat('private channel');
				await anotherContext.pageHomeChannel.content.doSendMessage('Hello');
				await pageHomeChannel.sidenav.doOpenChat('private channel');
				await pageHomeChannel.content.doSendMessage('Hello');
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = page.locator('[data-qa-type="message"][data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('[data-qa-type="message"][data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('Direct Message', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.pageHomeChannel.sidenav.doOpenChat('rocketchat.internal.admin.test');
				await anotherContext.pageHomeChannel.content.doSendMessage('Hello');
				await pageHomeChannel.sidenav.doOpenChat('user.name.test');
				await pageHomeChannel.content.doSendMessage('Hello');
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = page.locator('[data-qa-type="message"][data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('[data-qa-type="message"][data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('File Upload', async () => {
			test.beforeAll(async () => {
				await pageHomeChannel.sidenav.doOpenChat('general');
			});

			test.beforeEach(async () => {
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
				await pageHomeChannel.content.fileNameInput.type('any_file1.txt');
				await pageHomeChannel.content.buttonSend.click();
				await expect(pageHomeChannel.content.lastMessageFileName).toContainText('any_file1.txt');
			});
		});

		test.describe('Messaging actions', async () => {
			test.beforeAll(async () => {
				await pageHomeChannel.sidenav.doOpenChat('general');
			});

			test('expect reply the message', async () => {
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
});
