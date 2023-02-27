import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { OmnichannelDepartments } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('omnichannel-departments', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');
	let poOmnichannelDepartments: OmnichannelDepartments;

	let departmentName: string;
	let editedDepartmentName: string;

	test.beforeAll(async ({ api }) => {
		departmentName = faker.datatype.uuid();
		editedDepartmentName = `edited-${departmentName}`;
		// turn on department removal
		const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status();
		await expect(statusCode).toBe(200);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelDepartments = new OmnichannelDepartments(page);

		await page.goto('/omnichannel');
		await poOmnichannelDepartments.sidenav.linkDepartments.click();
	});

	test('Manage departments', async ({ page }) => {
		let url: string;
		await test.step('expect page to be empty', async () => {
			await page.goto('/omnichannel/departments/edit/this-department-dont-exist');
			await expect(poOmnichannelDepartments.btnEnabled).not.toBeVisible();
			await page.goBack();
		});
		await test.step('expect create new department', async () => {
			await poOmnichannelDepartments.btnNew.click();
			await poOmnichannelDepartments.btnEnabled.click();
			await poOmnichannelDepartments.inputName.fill(departmentName);
			await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
			await poOmnichannelDepartments.btnSave.click();
			await poOmnichannelDepartments.btnCloseToastSuccess.click();

			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
		});

		await test.step('expect update department name', async () => {
			await poOmnichannelDepartments.inputSearch.fill(departmentName);

			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuEditOption.click();

			url = await page.url();

			await poOmnichannelDepartments.inputName.fill(`edited-${departmentName}`);
			await poOmnichannelDepartments.btnSave.click();
			await poOmnichannelDepartments.btnCloseToastSuccess.click();

			await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
		});

		await test.step('expect archive department', async () => {
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

			await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

			await poOmnichannelDepartments.firstRowInTableMenu.click();

			await poOmnichannelDepartments.menuArchiveOption.click();

			await expect(poOmnichannelDepartments.toastSuccess).toBeVisible();
		});

		await test.step('expect archived department to not be editable', async () => {
			// Try to edit
			await page.goto(url);

			await expect(poOmnichannelDepartments.btnEnabled).not.toBeVisible();

			await page.goBack();
		});

		await test.step('expect unarchive department', async () => {
			await poOmnichannelDepartments.archivedDepartmentsTab.click();

			await poOmnichannelDepartments.inputSearch.fill(`edited-${departmentName}`);

			await poOmnichannelDepartments.firstRowInTableMenu.click();

			await poOmnichannelDepartments.menuUnarchiveOption.click();

			await expect(poOmnichannelDepartments.firstRowInTable).toHaveCount(0);
		});
	});

	test.describe('Agents', () => {
		test.beforeAll(async ({ api }) => {
			const statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();

			await expect(statusCode).toBe(200);
		});

		test.beforeEach(async () => {
			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();
		});

		test.afterAll(async ({ api }) => {
			await api.delete('/livechat/users/agent/user1');
		});

		test('expect add new agent', async () => {
			const newAgent = 'user1';
			await poOmnichannelDepartments.selectAgentToAdd.click();
			await poOmnichannelDepartments.getAgentOptionToAdd(newAgent).click();
			await poOmnichannelDepartments.btnAddAgent.click();

			await expect(poOmnichannelDepartments.findRowByName(newAgent)).toBeVisible();

			await poOmnichannelDepartments.btnSave.click();

			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();

			await expect(poOmnichannelDepartments.findRowByName(newAgent)).toBeVisible();
		});

		test('expect update agent count and number value', async () => {
			const newAgent = 'user1';
			const newValue = 1;
			await expect(poOmnichannelDepartments.findRowByName(newAgent)).toBeVisible();

			await poOmnichannelDepartments.findAgentCountInput(newAgent).fill(`${newValue}`);
			await poOmnichannelDepartments.findAgentNumberInput(newAgent).fill(`${newValue}`);
			await poOmnichannelDepartments.btnSave.click();

			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();

			await expect(poOmnichannelDepartments.findAgentCountInput(newAgent)).toHaveValue(`${newValue}`);
			await expect(poOmnichannelDepartments.findAgentNumberInput(newAgent)).toHaveValue(`${newValue}`);
		});

		test('expect remove new agent', async () => {
			const newAgent = 'user1';
			await expect(poOmnichannelDepartments.findRowByName(newAgent)).toBeVisible();

			await poOmnichannelDepartments.findAgentRemoveBtn(newAgent).click();
			await poOmnichannelDepartments.btnModalConfirmDelete.click();

			await expect(poOmnichannelDepartments.findRowByName(newAgent)).not.toBeVisible();
			await poOmnichannelDepartments.btnSave.click();

			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();

			await expect(poOmnichannelDepartments.findRowByName(newAgent)).not.toBeVisible();
		});
	});

	test('expect update department name', async () => {
		await poOmnichannelDepartments.inputSearch.fill(departmentName);

		await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();
		await poOmnichannelDepartments.inputName.fill(editedDepartmentName);
		await poOmnichannelDepartments.btnSave.click();

		await poOmnichannelDepartments.inputSearch.fill(editedDepartmentName);
		await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
	});

	test('Tags', async () => {
		const tagsDepartmentName = faker.datatype.uuid();

		await test.step('expect create new department', async () => {
			await poOmnichannelDepartments.btnNew.click();
			await poOmnichannelDepartments.btnEnabled.click();
			await poOmnichannelDepartments.inputName.fill(tagsDepartmentName);
			await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
			await poOmnichannelDepartments.btnSave.click();
			await poOmnichannelDepartments.btnCloseToastSuccess.click();

			await poOmnichannelDepartments.inputSearch.fill(tagsDepartmentName);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
		});

		await test.step('expect save form button be disabled', async () => {
			await poOmnichannelDepartments.inputSearch.fill(tagsDepartmentName);
			await poOmnichannelDepartments.firstRowInTableMenu.click();
			await poOmnichannelDepartments.menuEditOption.click();
			await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			await poOmnichannelDepartments.btnBack.click();
		});

		await test.step('Disabled tags state', async () => {
			await poOmnichannelDepartments.inputSearch.fill(tagsDepartmentName);
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
			await poOmnichannelDepartments.inputSearch.fill(tagsDepartmentName);
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

				await expect(poOmnichannelDepartments.btnTag(tagName)).toBeVisible();

				await expect(poOmnichannelDepartments.btnSave).toBeEnabled();

				await poOmnichannelDepartments.btnTag(tagName).click();
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

	test('expect delete department', async ({ page }) => {
		await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();

		await poOmnichannelDepartments.inputSearch.fill(editedDepartmentName);

		await page.waitForRequest('**/livechat/department**');

		await poOmnichannelDepartments.btnDeleteFirstRowInTable.click();
		await poOmnichannelDepartments.btnModalConfirmDelete.click();

		await poOmnichannelDepartments.inputSearch.fill(editedDepartmentName);

		await expect(poOmnichannelDepartments.firstRowInTable).toHaveCount(0);
	});
});
