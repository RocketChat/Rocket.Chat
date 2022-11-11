import fs from 'fs';
import * as path from 'path';

import { parse } from 'csv-parse';

import { test, expect } from './utils/test';
import { Admin } from './page-objects';

test.use({ storageState: 'admin-session.json' });

const rowUserName: string[] = [];
const slackCsvDir = path.resolve(__dirname, 'fixtures', 'files', 'slack_export_users.csv');

const csvToJson = (): void => {
	fs.createReadStream(slackCsvDir)
		.pipe(parse({ delimiter: ',', from_line: 2 }))
		.on('data', (rows) => {
			rowUserName.push(rows[0]);
		});
};

test.describe.serial('imports', () => {
	let poAdmin: Admin;

	test.beforeAll(() => {
		csvToJson();
	});

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
	});

	test('expect import users data from slack', async ({ page }) => {
		await page.goto('/admin/import');

		await poAdmin.btnImportNewFile.click();
		await (await poAdmin.getOptionFileType("Slack's Users CSV")).click();
		await poAdmin.inputFile.setInputFiles(slackCsvDir);

		await poAdmin.btnImport.click();
		await poAdmin.btnStartImport.waitFor({ state: 'visible' });

		await poAdmin.btnStartImport.click();

		await page.locator('[data-qa-id="ImportTable"]').waitFor({ state: 'visible' });

		await expect(poAdmin.importStatusTableFirstRowCell).toBeVisible();
	});

	test('expect all users is added is visible', async ({ page }) => {
		await page.goto('/admin/users');

		for (const user of rowUserName) {
			expect(page.locator(`tbody tr td:first-child >> text="${user}"`));
		}
	});
});
