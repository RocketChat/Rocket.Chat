import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelDepartments } from '../page-objects/omnichannel';
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
			await poOmnichannelDepartments.sidebar.linkDepartments.click();
		});

		test('Create department', async ({ page }) => {
			const departmentName = faker.string.uuid();

			await poOmnichannelDepartments.createNew();

			await test.step('expect name and email to be required', async () => {
				await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredName)).not.toBeVisible();
				await poOmnichannelDepartments.inputName.fill('any_text');
				await poOmnichannelDepartments.inputName.fill('');
				await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredName)).toBeVisible();
				await poOmnichannelDepartments.inputName.fill('any_text');
				await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredName)).not.toBeVisible();

				await poOmnichannelDepartments.inputEmail.fill('any_text');
				await expect(poOmnichannelDepartments.errorMessage(ERROR.invalidEmail)).toBeVisible();

				await poOmnichannelDepartments.inputEmail.fill('');
				await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredEmail)).toBeVisible();

				await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
				await expect(poOmnichannelDepartments.errorMessage(ERROR.requiredEmail)).not.toBeVisible();
			});

			await test.step('expect to fill required fields', async () => {
				await poOmnichannelDepartments.labelEnabled.click();
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
				await expect(poOmnichannelDepartments.agentsTable.findRowByName('user1')).toBeVisible();
			});

			await test.step('expect create new department', async () => {
				await poOmnichannelDepartments.btnSave.click();
				await poOmnichannelDepartments.search(departmentName);
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(departmentName)).toBeVisible();
			});

			await test.step('expect to delete department', async () => {
				await poOmnichannelDepartments.search(departmentName);
				await poOmnichannelDepartments.getDepartmentMenuByName(departmentName).click();
				await poOmnichannelDepartments.menuDeleteOption.click();

				await test.step('expect confirm delete department', async () => {
					await test.step('expect delete to be disabled when name is incorrect', async () => {
						await expect(poOmnichannelDepartments.deleteModal.btnDelete).toBeDisabled();
						await poOmnichannelDepartments.deleteModal.inputConfirmDepartmentName.fill('someramdomname');
						await expect(poOmnichannelDepartments.deleteModal.btnDelete).toBeDisabled();
					});

					await test.step('expect to successfuly delete if department name is correct', async () => {
						await expect(poOmnichannelDepartments.deleteModal.btnDelete).toBeDisabled();
						await poOmnichannelDepartments.deleteModal.inputConfirmDepartmentName.fill(departmentName);
						await expect(poOmnichannelDepartments.deleteModal.btnDelete).toBeEnabled();
						await poOmnichannelDepartments.deleteModal.deleteDepartment(departmentName);
					});
				});

				await test.step('expect department to have been deleted', async () => {
					await poOmnichannelDepartments.search(departmentName);
					await expect(poOmnichannelDepartments.departmentsTable.findRowByName(departmentName)).toHaveCount(0);
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
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(department.name)).toBeVisible();

				return department;
			});

			await test.step('expect update department name', async () => {
				await poOmnichannelDepartments.search(department.name);
				await poOmnichannelDepartments.getDepartmentMenuByName(department.name).click();
				await poOmnichannelDepartments.menuEditOption.click();

				await poOmnichannelDepartments.inputName.fill(`edited-${department.name}`);
				await poOmnichannelDepartments.btnSave.click();

				await poOmnichannelDepartments.search(`edited-${department.name}`);
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(`edited-${department.name}`)).toBeVisible();
			});
		});

		test('Archive department', async () => {
			await test.step('expect create new department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(department.name)).toBeVisible();
			});

			await test.step('expect archive department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(department.name)).toBeVisible();

				await poOmnichannelDepartments.archiveDepartmentByName(department.name);
				await poOmnichannelDepartments.tabArchivedDepartments.click();
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(department.name)).toBeVisible();
			});

			await test.step('expect archived department to not be edidepartmentsTable', async () => {
				await poOmnichannelDepartments.getDepartmentMenuByName(department.name).click();
				await expect(poOmnichannelDepartments.menuEditOption).not.toBeVisible();
			});

			await test.step('expect unarchive department', async () => {
				await poOmnichannelDepartments.menuUnarchiveOption.click();
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(department.name)).toHaveCount(0);
			});
		});

		test('Request tag(s) before closing conversation', async () => {
			await test.step('should create new department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(department.name)).toBeVisible();
			});

			const tagName = faker.string.sample(5);
			await poOmnichannelDepartments.getDepartmentMenuByName(department.name).click();
			await poOmnichannelDepartments.menuEditOption.click();

			await test.step('should form save button be disabled', async () => {
				await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			});

			await test.step('should be able to add a tag properly', async () => {
				await poOmnichannelDepartments.inputConversationClosingTags.fill(tagName);
				await poOmnichannelDepartments.btnAddTags.click();

				await expect(poOmnichannelDepartments.btnTag(tagName)).toBeVisible();
				await expect(poOmnichannelDepartments.btnSave).toBeEnabled();
			});

			await test.step('should be able to remove a tag properly', async () => {
				await poOmnichannelDepartments.btnTag(tagName).click();
				await expect(poOmnichannelDepartments.btnAddTags).toBeDisabled();
			});

			await test.step('should not be possible to add empty tags', async () => {
				await poOmnichannelDepartments.inputConversationClosingTags.fill('');
				await expect(poOmnichannelDepartments.btnAddTags).toBeDisabled();
			});

			await test.step('should not be possible to add same tag twice', async () => {
				const tagName = faker.string.sample(5);
				await poOmnichannelDepartments.inputConversationClosingTags.fill(tagName);
				await poOmnichannelDepartments.btnAddTags.click();
				await poOmnichannelDepartments.inputConversationClosingTags.fill(tagName);
				await expect(poOmnichannelDepartments.btnAddTags).toBeDisabled();
			});
		});

		test('Toggle department removal', async ({ api }) => {
			await test.step('expect create new department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await expect(poOmnichannelDepartments.departmentsTable.findRowByName(department.name)).toBeVisible();
			});

			await test.step('expect to be able to delete department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await poOmnichannelDepartments.getDepartmentMenuByName(department.name).click();
				await expect(poOmnichannelDepartments.menuDeleteOption).toBeEnabled();
			});

			await test.step('expect to disable department removal setting', async () => {
				const statusCode = (await api.post('/settings/Omnichannel_enable_department_removal', { value: false })).status();
				expect(statusCode).toBe(200);
			});

			await test.step('expect not to be able to delete department', async () => {
				await poOmnichannelDepartments.search(department.name);
				await poOmnichannelDepartments.getDepartmentMenuByName(department.name).click();
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
