import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { OmnichannelDepartments } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-departments', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');
	let poOmnichannelDepartments: OmnichannelDepartments;

	let departmentName: string;

	let url: string;

	test.beforeAll(async ({ api }) => {
		departmentName = faker.datatype.uuid();
		// turn on department removal
		const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status();
		await expect(statusCode).toBe(200);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelDepartments = new OmnichannelDepartments(page);

		await page.goto('/omnichannel');
		await poOmnichannelDepartments.sidenav.linkDepartments.click();
	});

	test('expect page to be empty', async ({ page }) => {
		await page.goto('/omnichannel/departments/edit/this-department-dont-exist');
		await expect(poOmnichannelDepartments.btnEnabled).not.toBeVisible();
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

	test('expect to not be possible adding a second department ', async () => {
		test.skip(IS_EE, 'Community Edition Only');

		await poOmnichannelDepartments.btnNew.click();

		await expect(poOmnichannelDepartments.upgradeDepartmentsModal).toBeVisible();

		await poOmnichannelDepartments.btnUpgradeDepartmentsModalClose.click();
	});

	test('expect update department name', async ({ page }) => {
		await poOmnichannelDepartments.inputSearch.fill(departmentName);

		await poOmnichannelDepartments.firstRowInTableMenu.click();
		await poOmnichannelDepartments.menuEditOption.click();

		url = await page.url();

		await poOmnichannelDepartments.inputName.fill(`edited-${departmentName}`);
		await poOmnichannelDepartments.btnSave.click();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);
		await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
	});

	test.describe('Tags', () => {
		test.beforeEach(async () => {
			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuEditOption.click();
		});

		test('expect save form button be disabled', async () => {
			await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
		});

		test('Disabled tags state', async () => {
			await test.step('expect to have department tags toggle button', async () => {
				await expect(poOmnichannelDepartments.toggleRequestTags).toBeVisible();
			});
			await test.step('expect have no add tag to department', async () => {
				await expect(poOmnichannelDepartments.inputTags).not.toBeVisible();
				await expect(poOmnichannelDepartments.btnTagsAdd).not.toBeVisible();
			});
		});

		test('Enabled tags state', async ({ page }) => {
			await test.step('expect to have form save option disabled', async () => {
				await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			});

			await test.step('expect clicking on toggle button to enable tags', async () => {
				await poOmnichannelDepartments.toggleRequestTags.click();
				await expect(poOmnichannelDepartments.inputTags).toBeVisible();
				await expect(poOmnichannelDepartments.btnTagsAdd).toBeVisible();
			});
			await test.step('expect to be invalid if there is no tag added', async () => {
				await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
				await expect(poOmnichannelDepartments.invalidInputTags).toBeVisible();
			});

			await test.step('expect to be not possible adding empty tags', async () => {
				await poOmnichannelDepartments.inputTags.fill('');
				await expect(poOmnichannelDepartments.btnTagsAdd).toBeDisabled();
			});

			await test.step('expect to have add and remove one tag properly tags', async () => {
				const tagName = faker.datatype.string(5);
				await poOmnichannelDepartments.inputTags.fill(tagName);
				await poOmnichannelDepartments.btnTagsAdd.click();

				await expect(page.locator(`button`, { hasText: tagName })).toBeVisible();

				await expect(poOmnichannelDepartments.btnSave).toBeEnabled();

				await page.locator(`button`, { hasText: tagName }).click();
				await expect(poOmnichannelDepartments.invalidInputTags).toBeVisible();
				await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			});
			await test.step('expect to not be possible adding same tag twice', async () => {
				const tagName = faker.datatype.string(5);
				await poOmnichannelDepartments.inputTags.fill(tagName);
				await poOmnichannelDepartments.btnTagsAdd.click();
				await poOmnichannelDepartments.inputTags.fill(tagName);
				await expect(poOmnichannelDepartments.btnTagsAdd).toBeDisabled();
			});
		});
	});

	test('expect archive and unarchive department', async ({ page }) => {
		await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

		await poOmnichannelDepartments.firstRowInTableMenu.click();

		await poOmnichannelDepartments.menuArchiveOption.click();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

		await expect(poOmnichannelDepartments.firstRowInTable).toHaveCount(0);

		// Try to edit

		await page.goto(url);

		await expect(poOmnichannelDepartments.btnEnabled).not.toBeVisible();

		await page.goBack();

		await poOmnichannelDepartments.archivedDepartmentsTab.click();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

		await poOmnichannelDepartments.firstRowInTableMenu.click();

		await poOmnichannelDepartments.menuUnarchiveOption.click();

		await expect(poOmnichannelDepartments.firstRowInTable).toHaveCount(0);

		await poOmnichannelDepartments.allDepartmentsTab.click();
	});

	test('expect delete department', async () => {
		await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

		await poOmnichannelDepartments.firstRowInTableMenu.click();

		await poOmnichannelDepartments.menuDeleteOption.click();

		await poOmnichannelDepartments.inputModalConfirmDelete.fill(`edited-${departmentName}`);

		await poOmnichannelDepartments.btnModalConfirmDelete.click();

		await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

		await expect(poOmnichannelDepartments.firstRowInTable).toHaveCount(0);
	});
});
