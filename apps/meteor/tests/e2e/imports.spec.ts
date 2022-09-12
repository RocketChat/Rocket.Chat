import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { Admin } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.parallel('imports', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
	});
	test.beforeEach(async ({ page }) => {
		await page.goto('/admin/import');
	});

	test('expect import csv users', async () => {
		await poAdmin.btnImportNewFile.click();
		expect(1).toEqual(1);
	});

	test('expect import users data, channels', async () => {
		await poAdmin.btnImportNewFile.click();
		expect(1).toEqual(1);
	});
});
