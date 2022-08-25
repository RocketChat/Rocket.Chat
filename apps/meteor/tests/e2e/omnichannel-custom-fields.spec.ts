import { test, expect } from './utils/test';
import { OmnichannelCustomFields } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-agents', () => {
	let poOmnichannelCustomFields: OmnichannelCustomFields;
	const newField = 'any_field';
	test.beforeEach(async ({ page }) => {
		poOmnichannelCustomFields = new OmnichannelCustomFields(page);

		await page.goto('/omnichannel');
		await poOmnichannelCustomFields.sidenav.linkCustomFields.click();
	});

	test('expect add new "custom field"', async ({ page }) => {
		await poOmnichannelCustomFields.btnAdd.click();

		await page.waitForURL('/omnichannel/customfields/new');
		await poOmnichannelCustomFields.inputField.type(newField);
		await poOmnichannelCustomFields.inputLabel.type('any_label');

		await poOmnichannelCustomFields.btnSave.click();

		await expect(poOmnichannelCustomFields.firstRowInTable(newField)).toBeVisible();
	});

	test('expect update "newField"', async ({ page }) => {
		const newLabel = 'new_any_label';
		await poOmnichannelCustomFields.inputSearch.fill(newField);
		await poOmnichannelCustomFields.firstRowInTable(newField).click();

		await poOmnichannelCustomFields.inputLabel.fill('new_any_label');
		await poOmnichannelCustomFields.btnEditSave.click();

		await expect(page.locator(`[qa-user-id="${newField}"] td:nth-child(2)`)).toHaveText(newLabel);
	});

	test('expect remove "new_field"', async () => {
		await poOmnichannelCustomFields.inputSearch.fill(newField);
		await poOmnichannelCustomFields.btnDeletefirstRowInTable.click();
		await poOmnichannelCustomFields.btnModalRemove.click();

		await poOmnichannelCustomFields.inputSearch.fill(newField);
		expect(poOmnichannelCustomFields.firstRowInTable(newField)).toBeHidden();
	});
});
