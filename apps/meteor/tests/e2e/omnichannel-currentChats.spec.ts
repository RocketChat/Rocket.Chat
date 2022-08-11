import { test, expect, Page } from '@playwright/test';

import { Auth, OmnichannelCurrentChats } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('Current Chats', () => {
	let pageOmnichannelCurrentChats: OmnichannelCurrentChats;

	test.beforeEach(async ({ page }) => {
		pageOmnichannelCurrentChats = new OmnichannelCurrentChats(page);
		await page.goto('/omnichannel');
		await pageOmnichannelCurrentChats.sidenav.linkCurrentChats.click();
	});

	test.describe('Render Fields', () => {
		test('expect render all form fields', async () => {
			await expect(pageOmnichannelCurrentChats.guestField).toBeVisible();

			await expect(pageOmnichannelCurrentChats.servedByField).toBeVisible();

			await expect(pageOmnichannelCurrentChats.statusField).toBeVisible();

			await expect(pageOmnichannelCurrentChats.fromField).toBeVisible();

			await expect(pageOmnichannelCurrentChats.toField).toBeVisible();

			await expect(pageOmnichannelCurrentChats.departmentField).toBeVisible();

			await expect(pageOmnichannelCurrentChats.formOptions).toBeVisible();
		});
	});

	test.describe('Render Options', () => {
		test.beforeEach(async () => {
			await pageOmnichannelCurrentChats.doOpenOptions();
		});
		test('expect to render options', async () => {
			await expect(pageOmnichannelCurrentChats.formOptions).toBeVisible();

			await expect(pageOmnichannelCurrentChats.clearFiltersOption).toBeVisible();

			await expect(pageOmnichannelCurrentChats.removeAllClosedOption).toBeVisible();

			await expect(pageOmnichannelCurrentChats.customFieldsOption).toBeVisible();
		});
	});

	test.describe('Render Table', () => {
		test('expect to render table header', async () => {
			await expect(pageOmnichannelCurrentChats.table).toBeVisible();

			await expect(pageOmnichannelCurrentChats.tableHeaderName).toBeVisible();

			await expect(pageOmnichannelCurrentChats.tableHeaderDepartment).toBeVisible();

			await expect(pageOmnichannelCurrentChats.tableHeaderServedBy).toBeVisible();

			await expect(pageOmnichannelCurrentChats.tableHeaderStartedAt).toBeVisible();

			await expect(pageOmnichannelCurrentChats.tableHeaderLastMessage).toBeVisible();

			await expect(pageOmnichannelCurrentChats.tableHeaderStatus).toBeVisible();
		});
	});
});
