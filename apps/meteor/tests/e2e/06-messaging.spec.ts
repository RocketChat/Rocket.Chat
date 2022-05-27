import { expect, test, Browser, Page } from '@playwright/test';

import { adminLogin, validUserInserted } from './utils/mocks/userAndPasswordMock';
import { Login, MainContent, SideNav, FlexTab } from './page-objects';

type ChatContext = {
	mainContent: MainContent;
	sideNav: SideNav;
	page: Page;
};

const createBrowserContextForChat = async (browser: Browser): Promise<ChatContext> => {
	const page = await browser.newPage();

	const login = new Login(page);
	const mainContent = new MainContent(page);
	const sideNav = new SideNav(page);

	await page.goto('/');
	await login.doLogin(validUserInserted);

	return { mainContent, sideNav, page };
};

test.describe('[Messaging]', () => {
	let login: Login;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let flexTab: FlexTab;

	test.beforeAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		login = new Login(page);
		mainContent = new MainContent(page);
		sideNav = new SideNav(page);
		flexTab = new FlexTab(page);

		await page.goto('/');
		await login.doLogin(adminLogin);
	});

	test.describe('[Normal messaging]', async () => {
		let anotherContext: ChatContext;

		test.describe('[General channel]', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.sideNav.general.click();
				await anotherContext.mainContent.doSendMessage('Hello');
				await sideNav.general.click();
				await mainContent.doSendMessage('Hello');
			});

			test.afterAll(async () => {
				await anotherContext.page.close();
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('[Public channel]', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.sideNav.doFindForChat('public channel');
				await anotherContext.mainContent.doSendMessage('Hello');
				await sideNav.doFindForChat('public channel');
				await mainContent.doSendMessage('Hello');
			});

			test.afterAll(async () => {
				await anotherContext.page.close();
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('[Private channel]', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.sideNav.doFindForChat('private channel');
				await anotherContext.mainContent.doSendMessage('Hello');
				await sideNav.doFindForChat('private channel');
				await mainContent.doSendMessage('Hello');
			});

			test.afterAll(async () => {
				await anotherContext.page.close();
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('[Direct Message]', async () => {
			test.beforeAll(async ({ browser }) => {
				anotherContext = await createBrowserContextForChat(browser);
				await anotherContext.sideNav.doFindForChat('rocketchat.internal.admin.test');
				await anotherContext.mainContent.doSendMessage('Hello');
				await sideNav.doFindForChat('user.name.test');
				await mainContent.doSendMessage('Hello');
			});

			test.afterAll(async () => {
				await anotherContext.page.close();
			});

			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.page.locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('[File Upload]', async () => {
			test.beforeAll(async () => {
				await sideNav.general.click();
			});

			test.describe('[Render]', async () => {
				test.beforeAll(async () => {
					await mainContent.dragAndDropFile();
				});

				test('expect modal is visible', async () => {
					await expect(mainContent.modalTitle).toHaveText('File Upload');
				});

				test('expect cancel button is visible', async () => {
					await expect(mainContent.btnModalCancel).toBeVisible();
				});

				test('expect confirm button is visible', async () => {
					await expect(mainContent.btnModalSendMessage).toBeVisible();
				});

				test('expect file preview is visible', async () => {
					await expect(mainContent.modalFilePreview).toBeVisible();
				});

				test('expect file name input is visible', async () => {
					await expect(mainContent.fileName).toBeVisible();
					await expect(mainContent.fileName).toHaveText('File name');
				});

				test('expect file description is visible', async () => {
					await expect(mainContent.fileDescription).toBeVisible();
					await expect(mainContent.fileDescription).toHaveText('File description');
				});
			});
			test.describe('[Actions]', async () => {
				test.beforeEach(async () => {
					await mainContent.dragAndDropFile();
				});

				test('expect not show modal after click in cancel button', async () => {
					await mainContent.btnModalCancel.click();
					await expect(mainContent.modalFilePreview).not.toBeVisible();
				});

				test('expect send file not show modal', async () => {
					await mainContent.btnModalSendMessage.click();
					await expect(mainContent.modalFilePreview).not.toBeVisible();
				});

				test('expect send file with description', async () => {
					await mainContent.inputDescription.type('any_description');
					await mainContent.btnModalSendMessage.click();
					await expect(mainContent.getFileDescription).toHaveText('any_description');
				});

				test('expect send file with different file name', async () => {
					await mainContent.inputFileName.fill('any_file1.txt');
					await mainContent.btnModalSendMessage.click();
					await expect(mainContent.lastMessageFileName).toContainText('any_file1.txt');
				});
			});
		});

		test.describe('[Messaging actions]', async () => {
			test.describe('[Usage]', async () => {
				test.beforeAll(async () => {
					await sideNav.general.click();
				});

				test.describe('[Reply]', async () => {
					test.beforeAll(async () => {
						await mainContent.doSendMessage('This is a message for reply');
						await mainContent.doOpenMessageActionMenu();
					});

					test('expect reply the message', async () => {
						await mainContent.selectAction('reply');
						await flexTab.inputMessage.type('this is a reply message');
						await flexTab.keyPress('Enter');
						await expect(flexTab.flexTabViewThreadMessage).toHaveText('this is a reply message');
						await flexTab.btnCloseThreadMessage.click();
					});
				});

				test.describe('[Edit]', async () => {
					test.beforeAll(async () => {
						await mainContent.doSendMessage('This is a message for edit');
						await mainContent.doOpenMessageActionMenu();
					});

					test('expect edit the message', async () => {
						await mainContent.selectAction('edit');
					});
				});

				test.describe('[Delete]', async () => {
					test.beforeAll(async () => {
						await mainContent.doSendMessage('Message for Message Delete Tests');
						await mainContent.doOpenMessageActionMenu();
					});

					test('expect message is deleted', async () => {
						await mainContent.selectAction('delete');
					});
				});

				test.describe('[Quote]', async () => {
					const message = `Message for quote Tests - ${Date.now()}`;

					test.beforeAll(async () => {
						await mainContent.doSendMessage(message);
						await mainContent.doOpenMessageActionMenu();
					});

					test('it should quote the message', async () => {
						await mainContent.selectAction('quote');
						await expect(mainContent.waitForLastMessageTextAttachmentEqualsText).toHaveText(message);
					});
				});

				test.describe('[Star]', async () => {
					test.beforeAll(async () => {
						await mainContent.doSendMessage('Message for star Tests');
						await mainContent.doOpenMessageActionMenu();
					});

					test('it should star the message', async () => {
						await mainContent.selectAction('star');
					});
				});

				test.describe('[Copy]', async () => {
					test.beforeAll(async () => {
						await mainContent.doSendMessage('Message for copy Tests');
						await mainContent.doOpenMessageActionMenu();
					});

					test('it should copy the message', async () => {
						await mainContent.selectAction('copy');
					});
				});

				test.describe('[Permalink]', async () => {
					test.beforeAll(async () => {
						await mainContent.doSendMessage('Message for permalink Tests');
						await mainContent.doOpenMessageActionMenu();
					});

					test('it should permalink the message', async () => {
						await mainContent.selectAction('permalink');
					});
				});
			});
		});
	});
});
