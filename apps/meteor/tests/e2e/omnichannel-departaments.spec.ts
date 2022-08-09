import { faker } from '@faker-js/faker';

import { test, expect } from './utils/test';
import { OmnichannelDepartaments } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-departaments', () => {
	let poOmnichannelDepartaments: OmnichannelDepartaments;

	const departmentName = faker.datatype.uuid();

	test.beforeEach(async ({ page }) => {
		poOmnichannelDepartaments = new OmnichannelDepartaments(page);

		await page.goto('/omnichannel');
		await poOmnichannelDepartaments.sidenav.linkDepartments.click();
	});

	test('expect create new department', async () => {
		await poOmnichannelDepartaments.btnNew.click();
		await poOmnichannelDepartaments.btnEnabled.click();
		await poOmnichannelDepartaments.inputName.fill(departmentName);
		await poOmnichannelDepartaments.inputEmail.fill(faker.internet.email());
		await poOmnichannelDepartaments.btnSave.click();

		await poOmnichannelDepartaments.inputSearch.fill(departmentName);
		await expect(poOmnichannelDepartaments.firstRowInTable).toBeVisible();
	});

	test('expect update department name', async () => {
		await poOmnichannelDepartaments.inputSearch.fill(departmentName);

		await poOmnichannelDepartaments.firstRowInTable.locator(`text=${departmentName}`).click();
		await poOmnichannelDepartaments.inputName.fill(`edited-${departmentName}`);
		await poOmnichannelDepartaments.btnSave.click();

		await poOmnichannelDepartaments.inputSearch.fill(`edited-${departmentName}`);
		await expect(poOmnichannelDepartaments.firstRowInTable).toBeVisible();
	});

	test('expect delete department', async () => {
		await poOmnichannelDepartaments.inputSearch.fill(`edited-${departmentName}`);

		await poOmnichannelDepartaments.btnDeletefirstRowInTable.click();
		await poOmnichannelDepartaments.btnModalConfirmDelete.click();

		await poOmnichannelDepartaments.inputSearch.fill(`edited-${departmentName}`);
		await expect(poOmnichannelDepartaments.firstRowInTable).toBeHidden();
	});
});
