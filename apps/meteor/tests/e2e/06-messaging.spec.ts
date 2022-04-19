import { expect, test } from '@playwright/test';

import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import LoginPage from './utils/pageobjects/LoginPage';
import FlexTab from './utils/pageobjects/FlexTab';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

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

	// test.describe('[Normal messaging]', async () => {
	// 	test.describe('[General channel]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		});
	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// 	test.describe('[Public channel]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		})

	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// 	test.describe('[Private channel]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		})

	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// 	test.describe('[Direct message]', async () => {
	// 		test.beforeAll(async () => {
	// 			await sideNav.general().click()
	// 			await mainContent.sendMessage('any_message');
	// 		})

	// 		test('expect message have user name from logged user', async () => {
	// 			await expect(mainContent.lastMessage()).toContainText('rocketchat.internal.admin.test')
	// 		});
	// 	})
	// })

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
				await expect(mainContent.lastMessageFileName()).toHaveText('any_description');
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
			test.describe.only('Reply:', async () => {
				test.beforeAll(async () => {
					await mainContent.sendMessage('This is a message for reply');
					await mainContent.openMessageActionMenu();
				});
				test('expect reply the message', async () => {
					await mainContent.selectAction('reply');
					await flexTab.messageInput().type('this is a reply message');
					await flexTab.keyboardPress('Enter');
					await flexTab.getPage().click('//*[@id="rocket-chat"]/div[3]/div[1]/main/div/aside/h3/div/button');

					await expect(mainContent.reply()).toBeVisible();
				});
			});

			test.describe('Edit:', async () => {
				test.beforeAll(async () => {
					await mainContent.sendMessage('This is a message for edit');
					await mainContent.openMessageActionMenu();
				});

				test('expect edit the message', async () => {
					await mainContent.selectAction('edit');
				});
			});

			test.describe('Delete:', async () => {
				test.beforeAll(async () => {
					await mainContent.sendMessage('Message for Message Delete Tests');
					await mainContent.openMessageActionMenu();
				});

				test('exepect message is deleted', async () => {
					await mainContent.selectAction('delete');
				});
			});

			test.describe('Quote:', async () => {
				const message = `Message for quote Tests - ${Date.now()}`;

				test.beforeAll(async () => {
					await mainContent.sendMessage(message);
					await mainContent.openMessageActionMenu();
				});

				test('it should quote the message', async () => {
					await mainContent.selectAction('quote');
					await mainContent.sendBtn().click();
					await mainContent.waitForLastMessageTextAttachmentEqualsText(message);
				});
			});

			test.describe('Star:', async () => {
				test.beforeAll(async () => {
					await mainContent.sendMessage('Message for star Tests');
					await mainContent.openMessageActionMenu();
				});

				test('it should star the message', async () => {
					await mainContent.selectAction('star');
				});
			});

			test.describe('Copy:', async () => {
				test.beforeAll(async () => {
					await mainContent.sendMessage('Message for copy Tests');
					await mainContent.openMessageActionMenu();
				});

				test('it should copy the message', async () => {
					await mainContent.selectAction('copy');
				});
			});

			test.describe('Permalink:', async () => {
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
