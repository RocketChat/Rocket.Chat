import { test, expect, Page } from '@playwright/test';

import { Auth, OmnichannelCurrentChats } from './page-objects';

test.describe('Current Chats', () => {
	let page: Page;
	let pageAuth: Auth;
	let pageOmnichannelCurrentChats: OmnichannelCurrentChats;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		pageAuth = new Auth(page);
		pageOmnichannelCurrentChats = new OmnichannelCurrentChats(page);
	});

	test.beforeAll(async () => {
		await pageAuth.doLogin();
		await page.goto('/omnichannel');
		await pageOmnichannelCurrentChats.currentChatsLink.click();
	});

	test.describe('Render Fields', () => {
		test('expect show guest Field', async () => {
			await expect(pageOmnichannelCurrentChats.guestField).toBeVisible();
		});
		test('expect show servedBy Field', async () => {
			await expect(pageOmnichannelCurrentChats.servedByField).toBeVisible();
		});
		test('expect show status Field', async () => {
			await expect(pageOmnichannelCurrentChats.statusField).toBeVisible();
		});
		test('expect show from Field', async () => {
			await expect(pageOmnichannelCurrentChats.fromField).toBeVisible();
		});
		test('expect show to Field', async () => {
			await expect(pageOmnichannelCurrentChats.toField).toBeVisible();
		});
		test('expect show department Field', async () => {
			await expect(pageOmnichannelCurrentChats.departmentField).toBeVisible();
		});
		test('expect show form options button', async () => {
			await expect(pageOmnichannelCurrentChats.formOptions).toBeVisible();
		});
	});

	test.describe('Render Options', () => {
		test.beforeEach(async () => {
			await pageOmnichannelCurrentChats.doOpenOptions();
		});
		test('expect show form options button', async () => {
			await expect(pageOmnichannelCurrentChats.formOptions).toBeVisible();
		});
		test('expect show clear filters option', async () => {
			await expect(pageOmnichannelCurrentChats.clearFiltersOption).toBeVisible();
		});
		test('expect show removeAllClosed option', async () => {
			await expect(pageOmnichannelCurrentChats.removeAllClosedOption).toBeVisible();
		});
		test('expect show custom fields option', async () => {
			await expect(pageOmnichannelCurrentChats.customFieldsOption).toBeVisible();
		});
	});

	test.describe('Forms Usage', async () => {
		test.describe('Fill Fields', async () => {
			test.beforeAll(async () => {
				await pageOmnichannelCurrentChats.doFillInputs();
			});

			test('expect guest to be filled', async () => {
				const guest = await pageOmnichannelCurrentChats.guestField.inputValue();
				await expect(guest === 'guest').toBeTruthy();
			});

			// TODO: Set up the prep needed to fill the servedByField field
			// test('expect servedBy to be filled', async () => {
			// 	const guest = await pageOmnichannelCurrentChats.guestField.inputValue();
			// 	await expect(guest === 'guest').toBeTruthy();
			// });

			test('expect status to be filled', async () => {
				const status = await pageOmnichannelCurrentChats.statusField.inputValue();
				await expect(status === 'open').toBeTruthy();
			});
			test('expect from to be filled', async () => {
				const from = await pageOmnichannelCurrentChats.fromField.inputValue();
				await expect(from === '2022-08-08').toBeTruthy();
			});
			test('expect to to be filled', async () => {
				const to = await pageOmnichannelCurrentChats.toField.inputValue();
				await expect(to === '2022-08-08').toBeTruthy();
			});

			// TODO: Set up the prep needed to fill the department field
			// test('expect department to be filled', async () => {
			// 	const department = await pageOmnichannelCurrentChats.departmentField.inputValue();
			// 	await expect(department === 'department').toBeTruthy();
			// });
		});

		test.describe('Clear Fields', async () => {
			test.beforeAll(async () => {
				await pageOmnichannelCurrentChats.doClearFilters();
			});

			test('expect guest to be filled', async () => {
				const guest = await pageOmnichannelCurrentChats.guestField.inputValue();
				await expect(guest === 'guest').not.toBeTruthy();
			});

			// TODO: Set up the prep needed to fill the servedByField field
			// test('expect servedBy to be filled', async () => {
			// 	const guest = await pageOmnichannelCurrentChats.guestField.inputValue();
			// 	await expect(guest === 'guest').toBeTruthy();
			// });

			test('expect status to be filled', async () => {
				const status = await pageOmnichannelCurrentChats.statusField.inputValue();
				await expect(status === 'open').not.toBeTruthy();
			});
			test('expect from to be filled', async () => {
				const from = await pageOmnichannelCurrentChats.fromField.inputValue();
				await expect(from === '2022-08-08').not.toBeTruthy();
			});
			test('expect to to be filled', async () => {
				const to = await pageOmnichannelCurrentChats.toField.inputValue();
				await expect(to === '2022-08-08').not.toBeTruthy();
			});

			// TODO: Set up the prep needed to fill the department field
			// test('expect department to be filled', async () => {
			// 	const department = await pageOmnichannelCurrentChats.departmentField.inputValue();
			// 	await expect(department === 'department').toBeTruthy();
			// });
		});
	});

	test.describe('Render Table', () => {
		test('expect show table', async () => {
			await expect(pageOmnichannelCurrentChats.table).toBeVisible();
		});
		test('expect show name header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderName).toBeVisible();
		});
		test('expect show department header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderDepartment).toBeVisible();
		});
		test('expect show servedBy header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderServedBy).toBeVisible();
		});
		test('expect show startedAt header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderStartedAt).toBeVisible();
		});
		test('expect show lastMessage header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderLastMessage).toBeVisible();
		});
		test('expect show form status header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderStatus).toBeVisible();
		});
	});
});
