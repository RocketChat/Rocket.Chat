import { faker } from '@faker-js/faker';

import { Users } from '../fixtures/userStates';
import { OmnichannelCustomFields } from '../page-objects/omnichannel';
import { createCustomField, removeCustomField } from '../utils/omnichannel/custom-field';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe('omnichannel-customFields', () => {
	let poOmnichannelCustomFields: OmnichannelCustomFields;
	const newField = 'any_field';
	const fieldToUpdate = `field_update_${faker.string.alpha(8)}`;
	const fieldToRemove = `field_remove_${faker.string.alpha(8)}`;
	let customFields: Awaited<ReturnType<typeof createCustomField>>[];

	test.beforeAll(async ({ api }) => {
		customFields = await Promise.all([
			createCustomField(api, { field: fieldToUpdate, label: 'any_label' }),
			createCustomField(api, { field: fieldToRemove, label: 'any_label' }),
		]);
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([...customFields.map((customField) => customField.delete()), removeCustomField(api, newField)]);
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannelCustomFields = new OmnichannelCustomFields(page);
		await poOmnichannelCustomFields.goto();
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
		await poOmnichannelCustomFields.inputSearch.fill(fieldToUpdate);
		await poOmnichannelCustomFields.table.findRowByName(fieldToUpdate).click();

		await poOmnichannelCustomFields.manageCustomFields.inputLabel.fill('new_any_label');
		await poOmnichannelCustomFields.manageCustomFields.labelVisible.click();
		await poOmnichannelCustomFields.manageCustomFields.save();

		await expect(poOmnichannelCustomFields.table.findRowByName(fieldToUpdate)).toContainText(newLabel);
	});

	test('expect remove "new_field"', async () => {
		await poOmnichannelCustomFields.inputSearch.fill(fieldToRemove);
		await poOmnichannelCustomFields.table.findRowByName(fieldToRemove).click();
		await poOmnichannelCustomFields.deleteCustomField(fieldToRemove);

		await poOmnichannelCustomFields.inputSearch.fill(fieldToRemove);
		await expect(poOmnichannelCustomFields.table.findRowByName(fieldToRemove)).toBeHidden();
	});
});
