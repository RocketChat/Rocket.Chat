import { Users } from '../fixtures/userStates';
import { OmnichannelCustomFields } from '../page-objects/omnichannel';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe('omnichannel-customFields', () => {
	let poOmnichannelCustomFields: OmnichannelCustomFields;
	const newField = 'any_field';
	test.beforeEach(async ({ page }) => {
		poOmnichannelCustomFields = new OmnichannelCustomFields(page);

		await page.goto('/omnichannel');
		await poOmnichannelCustomFields.sidebar.linkCustomFields.click();
	});

	test('expect add new "custom field"', async ({ page }) => {
		await poOmnichannelCustomFields.createNew();

		await page.waitForURL('/omnichannel/customfields/new');
		await poOmnichannelCustomFields.manageCustomFields.inputField.fill(newField);
		await poOmnichannelCustomFields.manageCustomFields.inputLabel.fill('any_label');
		await poOmnichannelCustomFields.manageCustomFields.save();

		await expect(poOmnichannelCustomFields.table.findRowByName(newField)).toBeVisible();
	});

	test('expect update "newField"', async () => {
		const newLabel = 'new_any_label';
		await poOmnichannelCustomFields.inputSearch.fill(newField);
		await poOmnichannelCustomFields.table.findRowByName(newField).click();

		await poOmnichannelCustomFields.manageCustomFields.inputLabel.fill('new_any_label');
		await poOmnichannelCustomFields.manageCustomFields.labelVisible.click();
		await poOmnichannelCustomFields.manageCustomFields.save();

		await expect(poOmnichannelCustomFields.table.findRowByName(newField)).toHaveText(newLabel);
	});

	test('expect remove "new_field"', async () => {
		await poOmnichannelCustomFields.inputSearch.fill(newField);
		await poOmnichannelCustomFields.table.findRowByName(newField).click();
		await poOmnichannelCustomFields.deleteCustomField(newField);

		await poOmnichannelCustomFields.inputSearch.fill(newField);
		await expect(poOmnichannelCustomFields.table.findRowByName(newField)).toBeHidden();
	});
});
