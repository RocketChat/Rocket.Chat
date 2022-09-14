import { test, expect } from './utils/test';
import { Admin } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('imports', () => {
	let poAdmin: Admin;

	test.beforeEach(async ({ page }) => {
		poAdmin = new Admin(page);
	});

	test('expect import users data from slack', async ({ page }) => {
		await page.goto('/admin/import');

		await poAdmin.btnImportNewFile.click();
		await poAdmin.selectFileType.click();
		await poAdmin.optionTypeFile("Slack's Users CSV").click();
		await poAdmin.inputFile.setInputFiles('./tests/e2e/fixtures/files/slack_csv_file.csv');

		await poAdmin.btnImport.click();
		await poAdmin.btnStartImport.waitFor({ state: 'visible' });

		await poAdmin.btnStartImport.click();

		await page.locator('[data-qa-id="ImportTable"]').waitFor({ state: 'visible' });

		await expect(poAdmin.importRow).toBeVisible();
	});

	test('expect all users is added is visible', async ({ page }) => {
		await page.goto('/admin/users');

		for (const user of ['user4.test', 'user5.test', 'user6.test']) {
			expect(page.locator(`tbody tr td:first-child >> text="${user}"`));
		}
	});
});
