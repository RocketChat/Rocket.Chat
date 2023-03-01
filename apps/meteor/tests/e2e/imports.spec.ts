import fs from 'fs';
import * as path from 'path';

import { parse } from 'csv-parse';

import { Users } from './fixtures/userStates';
import { Admin } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

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
	test.beforeAll(() => {
		csvToJson();
	});

	test('expect import users data from slack', async ({ page }) => {
		const poAdmin: Admin = new Admin(page);
		await page.goto('/admin/import');

		await poAdmin.btnImportNewFile.click();

		await (await poAdmin.getOptionFileType("Slack's Users CSV")).click();

		await poAdmin.inputFile.setInputFiles(slackCsvDir);
		await poAdmin.btnImport.click();

		await poAdmin.btnStartImport.click();

		await expect(poAdmin.importStatusTableFirstRowCell).toBeVisible({
			timeout: 30_000,
		});
	});

	test('expect to all users imported are actually listed as users', async ({ page }) => {
		await page.goto('/admin/users');

		for (const user of rowUserName) {
			expect(page.locator(`tbody tr td:first-child >> text="${user}"`));
		}
	});
});
