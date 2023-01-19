import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { test, expect } from './utils/test';
import { OmnichannelDepartments } from './page-objects';

test.use({ storageState: 'admin-session.json' });

test.describe.serial('omnichannel-departments', () => {
	let poOmnichannelDepartments: OmnichannelDepartments;

	let departmentName: string;
	let editedDepartmentName: string;
	test.beforeAll(() => {
		departmentName = faker.datatype.uuid();
		editedDepartmentName = `edited-${departmentName}`;
	});

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

	test.describe('Agents', () => {
		test.beforeAll(async ({ api }) => {
			let statusCode = (await api.post('/livechat/users/agent', { username: 'user1' })).status();
			expect(statusCode).toBe(200);

			statusCode = (await api.post('/livechat/users/agent', { username: 'user2' })).status();
			expect(statusCode).toBe(200);

			statusCode = (await api.post('/livechat/users/agent', { username: 'user3' })).status();
			expect(statusCode).toBe(200);
		});

		test.beforeEach(async () => {
			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();
		});

		test.afterAll(async ({ api }) => {
			await api.delete('/livechat/users/agent/user1');
			await api.delete('/livechat/users/agent/user2');
			await api.delete('/livechat/users/agent/user3');
			// await poOmnichannelDepartments.page.close();
		});

		test('expect add new agent', async () => {
			const newAgent = 'user1';
			await poOmnichannelDepartments.selectAgentToAdd.click();
			await poOmnichannelDepartments.getAgentOptionToAdd(newAgent).click();
			await poOmnichannelDepartments.btnAddAgent.click();

			await expect(poOmnichannelDepartments.findRowByName(newAgent)).toBeVisible();
			await poOmnichannelDepartments.btnSave.click();
		});

		test('expect remove new agent', async () => {
			const newAgent = 'user1';
			await expect(poOmnichannelDepartments.findRowByName(newAgent)).toBeVisible();

			await poOmnichannelDepartments.findAgentRemoveBtn(newAgent).click();
			await poOmnichannelDepartments.btnModalConfirmDelete.click();

			await expect(poOmnichannelDepartments.findRowByName(newAgent)).not.toBeVisible();
			await poOmnichannelDepartments.btnSave.click();
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

	test.describe('Tags', () => {
		test.beforeEach(async () => {
			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await poOmnichannelDepartments.firstRowInTable.locator(`text=${departmentName}`).click();
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
