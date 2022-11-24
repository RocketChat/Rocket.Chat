import { test, expect } from '@playwright/test';

import { OmnichannelCurrentChats } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('Current Chats', () => {
	let pageOmnichannelCurrentChats: OmnichannelCurrentChats;

	test.beforeEach(async ({ page }) => {
		pageOmnichannelCurrentChats = new OmnichannelCurrentChats(page);
		await page.goto('/omnichannel/current');
	});

	test('Render Fields', async () => {
		await test.step('expect show guest Field', async () => {
			await expect(pageOmnichannelCurrentChats.guestField).toBeVisible();
		});

		await test.step('expect show servedBy Field', async () => {
			await expect(pageOmnichannelCurrentChats.servedByField).toBeVisible();
		});

		await test.step('expect show status Field', async () => {
			await expect(pageOmnichannelCurrentChats.statusField).toBeVisible();
		});

		await test.step('expect show from Field', async () => {
			await expect(pageOmnichannelCurrentChats.fromField).toBeVisible();
		});

		await test.step('expect show to Field', async () => {
			await expect(pageOmnichannelCurrentChats.toField).toBeVisible();
		});

		await test.step('expect show department Field', async () => {
			await expect(pageOmnichannelCurrentChats.departmentField).toBeVisible();
		});

		await test.step('expect show form options button', async () => {
			await expect(pageOmnichannelCurrentChats.formOptions).toBeVisible();
		});
	});

	test('Render Options', async () => {
		await test.step('expect show form options button', async () => {
			await pageOmnichannelCurrentChats.doOpenOptions();
			await expect(pageOmnichannelCurrentChats.formOptions).toBeVisible();
		});

		await test.step('expect show clear filters option', async () => {
			await expect(pageOmnichannelCurrentChats.clearFiltersOption).toBeVisible();
		});

		await test.step('expect show removeAllClosed option', async () => {
			await expect(pageOmnichannelCurrentChats.removeAllClosedOption).toBeVisible();
		});

		await test.step('expect not to show custom fields option', async () => {
			await expect(pageOmnichannelCurrentChats.customFieldsOption).not.toBeVisible();
		});
	});

	test('Render Table', async () => {
		await test.step('expect show table', async () => {
			await expect(pageOmnichannelCurrentChats.table).toBeVisible();
		});

		await test.step('expect show name header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderName).toBeVisible();
		});

		await test.step('expect show department header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderDepartment).toBeVisible();
		});

		await test.step('expect show servedBy header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderServedBy).toBeVisible();
		});

		await test.step('expect show startedAt header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderStartedAt).toBeVisible();
		});

		await test.step('expect show lastMessage header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderLastMessage).toBeVisible();
		});

		await test.step('expect show form status header', async () => {
			await expect(pageOmnichannelCurrentChats.tableHeaderStatus).toBeVisible();
		});
	});
});
