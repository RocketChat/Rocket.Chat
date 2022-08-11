import { test, expect } from '@playwright/test';

import { OmnichannelCurrentChats } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('Current Chats', () => {
	let pageOmnichannelCurrentChats: OmnichannelCurrentChats;

	test.beforeEach(async ({ page }) => {
		pageOmnichannelCurrentChats = new OmnichannelCurrentChats(page);
		await page.goto('/omnichannel');
		await pageOmnichannelCurrentChats.sidenav.linkCurrentChats.click();
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
