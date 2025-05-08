import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelDepartments } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { createDepartment, deleteDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

const ERROR = {
	requiredName: 'Name required',
	requiredEmail: 'Email required',
	invalidEmail: 'Invalid email address',
};

test.use({ storageState: Users.admin.state });

test.describe('OC - Manage Departments', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let poOmnichannelDepartments: OmnichannelDepartments;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ api }) => {
		// turn on department removal
		await api.post('/settings/Omnichannel_enable_department_removal', { value: true });
		agent = await createAgent(api, 'user1');
	});

	test.afterAll(async ({ api }) => {
		// turn off department removal
		await api.post('/settings/Omnichannel_enable_department_removal', { value: false });
		await agent.delete();
	});

	test.describe('Create first department', async () => {
		test.beforeEach(async ({ page }: { page: Page }) => {
			poOmnichannelDepartments = new OmnichannelDepartments(page);

			await page.goto('/omnichannel');
			await poOmnichannelDepartments.sidenav.linkDepartments.click();
		});

		test('Create department', async ({ page }) => {
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

			await test.step('expect to fill required fields', async () => {
				await poOmnichannelDepartments.btnEnabled.click();
				await poOmnichannelDepartments.inputName.fill(departmentName);
				await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
			});

			await test.step('expect to fetch agents a reasonable number of times', async () => {
				let requestCount = 0;

				await page.route('**/v1/livechat/users/agent*', async (route) => {
					requestCount++;
					await route.continue();
				});

				await poOmnichannelDepartments.inputAgents.click();
				await poOmnichannelDepartments.inputAgents.fill('user1');

				await page.waitForTimeout(1000);
				await expect(requestCount).toBeGreaterThan(0);
				await expect(requestCount).toBeLessThan(3);

				await poOmnichannelDepartments.inputAgents.click();
			});

			await test.step('expect to add an agent', async () => {
				await poOmnichannelDepartments.inputAgents.click();
				await poOmnichannelDepartments.inputAgents.fill('user1');
				await poOmnichannelDepartments.findOption('user1 (@user1)').click();
				await poOmnichannelDepartments.btnAddAgent.click();
				await expect(poOmnichannelDepartments.findAgentRow('user1')).toBeVisible();
			});

			await test.step('expect create new department', async () => {
				await poOmnichannelDepartments.btnSave.click();
				await poOmnichannelDepartments.search(departmentName);
				await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
			});

			await test.step('expect to delete department', async () => {
				await poOmnichannelDepartments.search(departmentName);
				await poOmnichannelDepartments.selectedDepartmentMenu(departmentName).click();
				await poOmnichannelDepartments.menuDeleteOption.click();

				await test.step('expect confirm delete department', async () => {
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
	});

	test.describe('After creation', async () => {
		let department: Awaited<ReturnType<typeof createDepartment>>['data'];

		test.beforeEach(async ({ api, page }) => {
			poOmnichannelDepartments = new OmnichannelDepartments(page);

			department = await createDepartment(api).then((res) => res.data);
			await page.goto('/omnichannel/departments');
		});

		test.afterEach(async ({ api }) => {
			await deleteDepartment(api, { id: department._id });
		});

		test('Edit department', async () => {
			await test.step('expect create new department', async () => {
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

				await poOmnichannelDepartments.search(`edited-${department.name}`);
				await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
			});
		});

		test('Archive department', async () => {
			await test.step('expect create new department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
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
		});

		test('Request tag(s) before closing conversation', async () => {
			await test.step('expect create new department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
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

		test('Toggle department removal', async ({ api }) => {
			await test.step('expect create new department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
			});

			await test.step('expect to be able to delete department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await poOmnichannelDepartments.selectedDepartmentMenu(department.name).click();
				await expect(poOmnichannelDepartments.menuDeleteOption).toBeEnabled();
			});

			await test.step('expect to disable department removal setting', async () => {
				const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: false })).status();
				expect(statusCode).toBe(200);
			});

			await test.step('expect not to be able to delete department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await poOmnichannelDepartments.selectedDepartmentMenu(department.name).click();
				await expect(poOmnichannelDepartments.menuDeleteOption).toBeDisabled();
			});

			await test.step('expect to enable department removal setting', async () => {
				const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: true })).status();
				expect(statusCode).toBe(200);
			});

			await test.step('expect to delete department', async () => {
				const deleteRes = await deleteDepartment(api, { id: department._id });
				expect(deleteRes.status()).toBe(200);
			});
		});
	});
});
