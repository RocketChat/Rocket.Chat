import { expect, test, Browser } from '@playwright/test';

import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import LoginPage from './utils/pageobjects/LoginPage';
import FlexTab from './utils/pageobjects/FlexTab';
import { adminLogin, validUserInserted } from './utils/mocks/userAndPasswordMock';
import { ChatContext } from './utils/types/ChatContext';

const createBrowserContextForChat = async (browser: Browser, baseURL: string): Promise<ChatContext> => {
	const page = await browser.newPage();

	const loginPage = new LoginPage(page);
	const mainContent = new MainContent(page);
	const sideNav = new SideNav(page);

	await loginPage.goto(baseURL);
	await loginPage.login(validUserInserted);

	return { mainContent, sideNav };
};

test.describe('[Messaging]', () => {
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;
	let flexTab: FlexTab;
	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		loginPage = new LoginPage(page);
		mainContent = new MainContent(page);
		sideNav = new SideNav(page);
		flexTab = new FlexTab(page);

		await loginPage.goto(baseURL as string);

		await loginPage.login(adminLogin);
	});

	test.describe('[Normal messaging]', async () => {
		let anotherContext: ChatContext;

		test.describe('[General channel]', async () => {
			test.beforeAll(async ({ browser, baseURL }) => {
				anotherContext = await createBrowserContextForChat(browser, baseURL as string);
				await anotherContext.sideNav.general().click();
				await anotherContext.mainContent.sendMessage('Hello');
				await sideNav.general().click();
				await mainContent.sendMessage('Hello');
			});
			test.afterAll(async () => {
				await anotherContext.mainContent.getPage().close();
			});
			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = mainContent.getPage().locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.mainContent.getPage().locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});
		test.describe('[Public channel]', async () => {
			test.beforeAll(async ({ browser, baseURL }) => {
				anotherContext = await createBrowserContextForChat(browser, baseURL as string);
				await anotherContext.sideNav.findForChat('public channel');
				await anotherContext.mainContent.sendMessage('Hello');
				await sideNav.findForChat('public channel');
				await mainContent.sendMessage('Hello');
			});
			test.afterAll(async () => {
				await anotherContext.mainContent.getPage().close();
			});
			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = mainContent.getPage().locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.mainContent.getPage().locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('[Private channel]', async () => {
			test.beforeAll(async ({ browser, baseURL }) => {
				anotherContext = await createBrowserContextForChat(browser, baseURL as string);
				await anotherContext.sideNav.findForChat('private channel');
				await anotherContext.mainContent.sendMessage('Hello');
				await sideNav.findForChat('private channel');
				await mainContent.sendMessage('Hello');
			});
			test.afterAll(async () => {
				await anotherContext.mainContent.getPage().close();
			});
			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = mainContent.getPage().locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.mainContent.getPage().locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('[Direct Message]', async () => {
			test.beforeAll(async ({ browser, baseURL }) => {
				anotherContext = await createBrowserContextForChat(browser, baseURL as string);
				await anotherContext.sideNav.findForChat('rocketchat.internal.admin.test');
				await anotherContext.mainContent.sendMessage('Hello');
				await sideNav.findForChat('user.name.test');
				await mainContent.sendMessage('Hello');
			});
			test.afterAll(async () => {
				await anotherContext.mainContent.getPage().close();
			});
			test('expect received message is visible for two context', async () => {
				const anotherUserMessage = mainContent.getPage().locator('li.message[data-own="false"]').last();
				const mainUserMessage = anotherContext.mainContent.getPage().locator('li.message[data-own="false"]').last();

				await expect(anotherUserMessage).toBeVisible();
				await expect(mainUserMessage).toBeVisible();
			});
		});

		test.describe('[File Upload]', async () => {
			test.beforeAll(async () => {
				await sideNav.general().click();
			});
			test.describe('[Render]', async () => {
				test.beforeAll(async () => {
					await mainContent.dragAndDropFile();
				});
				test('expect modal is visible', async () => {
					await expect(mainContent.modalTitle()).toHaveText('File Upload');
				});
				test('expect cancel button is visible', async () => {
					await expect(mainContent.modalCancelButton()).toBeVisible();
				});
				test('expect confirm button is visible', async () => {
					await expect(mainContent.buttonSend()).toBeVisible();
				});
				test('expect file preview is visible', async () => {
					await expect(mainContent.modalFilePreview()).toBeVisible();
				});

				test('expect file name input is visible', async () => {
					await expect(mainContent.fileName()).toBeVisible();
					await expect(mainContent.fileName()).toHaveText('File name');
				});

				test('expect file description is visible', async () => {
					await expect(mainContent.fileDescription()).toBeVisible();
					await expect(mainContent.fileDescription()).toHaveText('File description');
				});
			});
			test.describe('[Actions]', async () => {
				test.beforeEach(async () => {
					await mainContent.dragAndDropFile();
				});

				test('expect not show modal after click in cancel button', async () => {
					await mainContent.cancelClick();
					await expect(mainContent.modalFilePreview()).not.toBeVisible();
				});

				test('expect send file not show modal', async () => {
					await mainContent.sendFileClick();
					await expect(mainContent.modalFilePreview()).not.toBeVisible();
				});
				test('expect send file with description', async () => {
					await mainContent.setDescription();
					await mainContent.sendFileClick();
					await expect(mainContent.getFileDescription()).toHaveText('any_description');
				});

				test('expect send file with different file name', async () => {
					await mainContent.setFileName();
					await mainContent.sendFileClick();
					await expect(mainContent.lastMessageFileName()).toContainText('any_file1.txt');
				});
			});
		});

		test.describe('[Messaging actions]', async () => {
			test.describe('[Usage]', async () => {
				test.beforeAll(async () => {
					await sideNav.general().click();
				});
				test.describe('[Reply]', async () => {
					test.beforeAll(async () => {
						await mainContent.sendMessage('This is a message for reply');
						await mainContent.openMessageActionMenu();
					});
					test('expect reply the message', async () => {
						await mainContent.selectAction('reply');
						await flexTab.messageInput().type('this is a reply message');
						await flexTab.keyboardPress('Enter');
						await expect(flexTab.flexTabViewThreadMessage()).toHaveText('this is a reply message');
						await flexTab.closeThreadMessage().click();
					});
				});

				test.describe('[Edit]', async () => {
					test.beforeAll(async () => {
						await mainContent.sendMessage('This is a message for edit');
						await mainContent.openMessageActionMenu();
					});

					test('expect edit the message', async () => {
						await mainContent.selectAction('edit');
					});
				});

				test.describe('[Delete]', async () => {
					test.beforeAll(async () => {
						await mainContent.sendMessage('Message for Message Delete Tests');
						await mainContent.openMessageActionMenu();
					});

					test('expect message is deleted', async () => {
						await mainContent.selectAction('delete');
					});
				});

				test.describe('[Quote]', async () => {
					const message = `Message for quote Tests - ${Date.now()}`;

					test.beforeAll(async () => {
						await mainContent.sendMessage(message);
						await mainContent.openMessageActionMenu();
					});

					test('it should quote the message', async () => {
						await mainContent.selectAction('quote');
						await expect(mainContent.waitForLastMessageTextAttachmentEqualsText()).toHaveText(message);
					});
				});

				test.describe('[Star]', async () => {
					test.beforeAll(async () => {
						await mainContent.sendMessage('Message for star Tests');
						await mainContent.openMessageActionMenu();
					});

					test('it should star the message', async () => {
						await mainContent.selectAction('star');
					});
				});

				test.describe('[Copy]', async () => {
					test.beforeAll(async () => {
						await mainContent.sendMessage('Message for copy Tests');
						await mainContent.openMessageActionMenu();
					});

					test('it should copy the message', async () => {
						await mainContent.selectAction('copy');
					});
				});

				test.describe('[Permalink]', async () => {
					test.beforeAll(async () => {
						await mainContent.sendMessage('Message for permalink Tests');
						await mainContent.openMessageActionMenu();
					});

					test('it should permalink the message', async () => {
						await mainContent.selectAction('permalink');
					});
				});
			});
		});
	});
});
