import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelDepartments } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-departments', () => {
	let poOmnichannelDepartments: OmnichannelDepartments;

	const departmentName = faker.datatype.uuid();

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelDepartments = new OmnichannelDepartments(page);

		await page.goto('/omnichannel');
		await poOmnichannelDepartments.sidenav.linkDepartments.click();
	});

	test('expect create new department', async () => {
		await poOmnichannelDepartments.btnNew.click();
		await poOmnichannelDepartments.btnEnabled.click();
		await poOmnichannelDepartments.inputName.fill(departmentName);
		await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
		await poOmnichannelDepartments.btnSave.click();

		await poOmnichannelDepartments.inputSearch.fill(departmentName);
		await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
	});

	test('expect update department name', async () => {
		await poOmnichannelDepartments.inputSearch.fill(departmentName);

		await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();
		await poOmnichannelDepartments.inputName.fill(`edited-${departmentName}`);
		await poOmnichannelDepartments.btnSave.click();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);
		await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
	});

	test('expect update adding department tags ', async () => {
		await poOmnichannelDepartments.inputSearch.fill(departmentName);

		await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();
		await poOmnichannelDepartments.toggleRequestTags.click();

		await poOmnichannelDepartments.inputTags.fill(faker.datatype.string(5));
		await poOmnichannelDepartments.btnTagsAdd.click();

		await poOmnichannelDepartments.btnSave.click();
	});

	test('expect delete department', async () => {
		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

		await poOmnichannelDepartments.btnDeleteFirstRowInTable.click();
		await poOmnichannelDepartments.btnModalConfirmDelete.click();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);
		await expect(poOmnichannelDepartments.firstRowInTable).toBeHidden();
	});
});
