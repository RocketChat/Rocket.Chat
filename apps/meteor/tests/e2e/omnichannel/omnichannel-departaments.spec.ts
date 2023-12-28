import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelDepartments } from '../page-objects';
import { createDepartment, deleteDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

const ERROR = {
	requiredName: 'The field name is required.',
	requiredEmail: 'The field email is required.',
	invalidEmail: 'Invalid email address',
};

test.use({ storageState: Users.admin.state });

test.describe('OC - Manage Departments', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let poOmnichannelDepartments: OmnichannelDepartments;

	test.beforeAll(async ({ api }) => {
		// turn on department removal
		const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status();
		await expect(statusCode).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		// turn off department removal
		const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: false })).status();
		await expect(statusCode).toBe(200);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelDepartments = new OmnichannelDepartments(page);

		await page.goto('/omnichannel');
		await poOmnichannelDepartments.sidenav.linkDepartments.click();
	});

	test('OC - Manage Departments - Create department', async () => {
		const departmentName = faker.string.uuid();

		await poOmnichannelDepartments.headingButtonNew('Create department').click();

		await test.step('expect name and email to be required', async () => {
			await expect(poOmnichannelDepartments.invalidInputEmail).not.toBeVisible();
			await poOmnichannelDepartments.inputName.fill('any_text');
			await poOmnichannelDepartments.inputName.fill('');
			await expect(poOmnichannelDepartments.invalidInputName).toBeVisible();
			await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredName)).toBeVisible();
			await poOmnichannelDepartments.inputName.fill('any_text');
			await expect(poOmnichannelDepartments.invalidInputName).not.toBeVisible();

			await poOmnichannelDepartments.inputEmail.fill('any_text');
			await expect(poOmnichannelDepartments.invalidInputEmail).toBeVisible();
			await expect(poOmnichannelDepartments.errorMessage(ERROR.invalidEmail)).toBeVisible();

			await poOmnichannelDepartments.inputEmail.fill('');
			await expect(poOmnichannelDepartments.invalidInputEmail).toBeVisible();
			await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredEmail)).toBeVisible();

			await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
			await expect(poOmnichannelDepartments.invalidInputEmail).not.toBeVisible();
			await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredEmail)).not.toBeVisible();
		});

		await test.step('expect create new department', async () => {
			await poOmnichannelDepartments.btnEnabled.click();
			await poOmnichannelDepartments.inputName.fill(departmentName);
			await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
			await poOmnichannelDepartments.btnSave.click();
			await poOmnichannelDepartments.btnCloseToastSuccess.click();

			await poOmnichannelDepartments.search(departmentName);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
		});

		await test.step('expect to delete department', async () => {
			await poOmnichannelDepartments.search(departmentName);
			await poOmnichannelDepartments.selectedDepartmentMenu(departmentName).click();
			await poOmnichannelDepartments.menuDeleteOption.click();

			await test.step('expect confirm delete department', async () => {
				await expect(poOmnichannelDepartments.modalConfirmDelete).toBeVisible();

				await test.step('expect delete to be disabled when name is incorrect', async () => {
					await expect(poOmnichannelDepartments.btnModalConfirmDelete).toBeDisabled();
					await poOmnichannelDepartments.inputModalConfirmDelete.fill('someramdomname');
					await expect(poOmnichannelDepartments.btnModalConfirmDelete).toBeDisabled();
				});

				await test.step('expect to successfuly delete if department name is correct', async () => {
					await expect(poOmnichannelDepartments.btnModalConfirmDelete).toBeDisabled();
					await poOmnichannelDepartments.inputModalConfirmDelete.fill(departmentName);
					await expect(poOmnichannelDepartments.btnModalConfirmDelete).toBeEnabled();
					await poOmnichannelDepartments.btnModalConfirmDelete.click();
				});
			});

			await test.step('expect department to have been deleted', async () => {
				await poOmnichannelDepartments.search(departmentName);
				await expect(poOmnichannelDepartments.firstRowInTable).toHaveCount(0);
			});
		});
	});

	test('OC - Manage Departments - Edit department', async ({ api }) => {
		const department = await test.step('expect create new department', async () => {
			const { data: department } = await createDepartment(api);

			await poOmnichannelDepartments.search(department.name);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

			return department;
		});

		await test.step('expect update department name', async () => {
			await poOmnichannelDepartments.search(department.name);

			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuEditOption.click();

			await poOmnichannelDepartments.inputName.fill(`edited-${department.name}`);
			await poOmnichannelDepartments.btnSave.click();
			await poOmnichannelDepartments.btnCloseToastSuccess.click();

			await poOmnichannelDepartments.search(`edited-${department.name}`);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
		});

		await test.step('expect to delete department', async () => {
			const deleteRes = await deleteDepartment(api, { id: department._id });
			await expect(deleteRes.status()).toBe(200);
		});
	});

	test('OC - Manage Departments - Archive department', async ({ api }) => {
		const department = await test.step('expect create new department', async () => {
			const { data: department } = await createDepartment(api);

			await poOmnichannelDepartments.search(department.name);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

			return department;
		});

		await test.step('expect archive department', async () => {
			await poOmnichannelDepartments.search(department.name);

			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuArchiveOption.click();
			await expect(poOmnichannelDepartments.toastSuccess).toBeVisible();

			await poOmnichannelDepartments.archivedDepartmentsTab.click();
			await poOmnichannelDepartments.search(department.name);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
		});

		await test.step('expect archived department to not be editable', async () => {
			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await expect(poOmnichannelDepartments.menuEditOption).not.toBeVisible();
		});

		await test.step('expect unarchive department', async () => {
			await poOmnichannelDepartments.menuUnarchiveOption.click();
			await expect(poOmnichannelDepartments.firstRowInTable).toHaveCount(0);
		});

		await test.step('expect to delete department', async () => {
			const deleteRes = await deleteDepartment(api, { id: department._id });
			await expect(deleteRes.status()).toBe(200);
		});
	});

	test('OC - Manage Departments - Request tag(s) before closing conversation', async ({ api }) => {
		const department = await test.step('expect create new department', async () => {
			const { data: department } = await createDepartment(api);

			await poOmnichannelDepartments.search(department.name);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

			return department;
		});

		await test.step('expect save form button be disabled', async () => {
			await poOmnichannelDepartments.search(department.name);
			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuEditOption.click();
			await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			await poOmnichannelDepartments.btnBack.click();
		});

		await test.step('Disabled tags state', async () => {
			await poOmnichannelDepartments.search(department.name);
			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuEditOption.click();

			await test.step('expect to have department tags toggle button', async () => {
				await expect(poOmnichannelDepartments.toggleRequestTags).toBeVisible();
			});

			await test.step('expect have no add tag to department', async () => {
				await expect(poOmnichannelDepartments.inputTags).not.toBeVisible();
				await expect(poOmnichannelDepartments.btnTagsAdd).not.toBeVisible();
				await poOmnichannelDepartments.btnBack.click();
			});
		});

		await test.step('Enabled tags state', async () => {
			const tagName = faker.string.sample(5);

			await poOmnichannelDepartments.search(department.name);
			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuEditOption.click();

			await test.step('expect to have form save option disabled', async () => {
				await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			});

			await test.step('expect clicking on toggle button to enable tags', async () => {
				await poOmnichannelDepartments.toggleRequestTags.click();
				await expect(poOmnichannelDepartments.inputTags).toBeVisible();
				await expect(poOmnichannelDepartments.btnTagsAdd).toBeVisible();
			});

			await test.step('expect to have add and remove one tag properly tags', async () => {
				await poOmnichannelDepartments.inputTags.fill(tagName);
				await poOmnichannelDepartments.btnTagsAdd.click();

				await expect(poOmnichannelDepartments.btnTag(tagName)).toBeVisible();
				await expect(poOmnichannelDepartments.btnSave).toBeEnabled();
			});

			await test.step('expect to be invalid if there is no tag added', async () => {
				await poOmnichannelDepartments.btnTag(tagName).click();
				await expect(poOmnichannelDepartments.invalidInputTags).toBeVisible();
				await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			});

			await test.step('expect to be not possible adding empty tags', async () => {
				await poOmnichannelDepartments.inputTags.fill('');
				await expect(poOmnichannelDepartments.btnTagsAdd).toBeDisabled();
			});

			await test.step('expect to not be possible adding same tag twice', async () => {
				const tagName = faker.string.sample(5);
				await poOmnichannelDepartments.inputTags.fill(tagName);
				await poOmnichannelDepartments.btnTagsAdd.click();
				await poOmnichannelDepartments.inputTags.fill(tagName);
				await expect(poOmnichannelDepartments.btnTagsAdd).toBeDisabled();
			});
		});
	});

	test('OC - Manage Departments - Toggle department removal', async ({ api }) => {
		const department = await test.step('expect create new department', async () => {
			const { data: department } = await createDepartment(api);

			await poOmnichannelDepartments.search(department.name);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

			return department;
		});

		await test.step('expect to be able to delete department', async () => {
			await poOmnichannelDepartments.search(department.name);
			await poOmnichannelDepartments.selectedDepartmentMenu(department.name).click();
			await expect(poOmnichannelDepartments.menuDeleteOption).toBeEnabled();
		});

		await test.step('expect to disable department removal setting', async () => {
			const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: false })).status();
			await expect(statusCode).toBe(200);
		});

		await test.step('expect not to be able to delete department', async () => {
			await poOmnichannelDepartments.search(department.name);
			await poOmnichannelDepartments.selectedDepartmentMenu(department.name).click();
			await expect(poOmnichannelDepartments.menuDeleteOption).toBeDisabled();
		});

		await test.step('expect to enable department removal setting', async () => {
			const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status();
			await expect(statusCode).toBe(200);
		});

		await test.step('expect to delete department', async () => {
			const deleteRes = await deleteDepartment(api, { id: department._id });
			await expect(deleteRes.status()).toBe(200);
		});
	});
});
