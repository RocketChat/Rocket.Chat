import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelAgents } from '../page-objects';
import { createDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('OC - Manage Agents', () => {
	let poOmnichannelAgents: OmnichannelAgents;
	let department: Awaited<ReturnType<typeof createDepartment>>;

	// Create agent and department
	test.beforeEach(async ({ api }) => {
		department = await createDepartment(api);
	});

	// Create page object and redirect to home
	test.beforeEach(async ({ page }) => {
		poOmnichannelAgents = new OmnichannelAgents(page);

		await page.goto('/omnichannel');
		await poOmnichannelAgents.sidenav.linkAgents.click();
	});

	// Ensure that there is no leftover data even if test fails
	test.afterEach(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.post('/settings/Omnichannel_enable_department_removal', { value: true }).then((res) => expect(res.status()).toBe(200));
		await department.delete();
		await api.post('/settings/Omnichannel_enable_department_removal', { value: false }).then((res) => expect(res.status()).toBe(200));
	});

	test('OC - Manage Agents - Add, search and remove using table', async ({ page }) => {
		await test.step('expect "user1" be first ', async () => {
			await poOmnichannelAgents.inputUsername.type('user');
			await expect(page.locator('role=option[name="user1"]')).toContainText('user1');

			await poOmnichannelAgents.inputUsername.fill('');
		});

		await test.step('expect add "user1" as agent', async () => {
			await poOmnichannelAgents.selectUsername('user1');
			await poOmnichannelAgents.btnAdd.click();

			await poOmnichannelAgents.inputSearch.fill('user1');
			await expect(poOmnichannelAgents.firstRowInTable).toBeVisible();
			await expect(poOmnichannelAgents.firstRowInTable).toHaveText('user1');
		});

		await test.step('expect remove "user1" as agent', async () => {
			await poOmnichannelAgents.inputSearch.fill('user1');
			await poOmnichannelAgents.btnDeleteFirstRowInTable.click();
			await poOmnichannelAgents.btnModalRemove.click();

			await poOmnichannelAgents.inputSearch.fill('user1');
			await expect(poOmnichannelAgents.findRowByUsername('user1')).not.toBeVisible();
		});
	});

	test('OC - Manage Agents [CE]- Edit and Remove', async () => {
		test.skip(IS_EE, 'Community Edition Only');

		await poOmnichannelAgents.selectUsername('user1');
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.firstRowInTable.click();
		await poOmnichannelAgents.btnEdit.click();

		await test.step('expect max chats fields to be hidden', async () => {
			await expect(poOmnichannelAgents.inputMaxChats).toBeHidden();
		});

		await test.step('expect update "user1" information', async () => {
			await poOmnichannelAgents.selectStatus('Not available');
			await poOmnichannelAgents.selectDepartment(department.data.name);
			await poOmnichannelAgents.btnSave.click();
		});

		await test.step('expect removing "user1" via sidebar', async () => {
			await poOmnichannelAgents.inputSearch.fill('user1');
			await poOmnichannelAgents.firstRowInTable.click();
			await poOmnichannelAgents.btnRemove.click();
		});
	});

	test('OC - Manage Agents [EE] - Edit ', async () => {
		test.skip(!IS_EE, 'Enterprise Only');

		await poOmnichannelAgents.selectUsername('user1');
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.findRowByUsername('user1').click();
		await poOmnichannelAgents.btnEdit.click();

		await test.step('expect max chats field to be visible', async () => {
			await expect(poOmnichannelAgents.inputMaxChats).toBeVisible();
		});

		await test.step('expect update "user1" information', async () => {
			await poOmnichannelAgents.inputMaxChats.click();
			await poOmnichannelAgents.inputMaxChats.fill('2');
			await poOmnichannelAgents.btnSave.click();
		});
	});

	test('OC - Edit agent  - Manage departments', async ({ page }) => {
		await poOmnichannelAgents.selectUsername('user1');
		await poOmnichannelAgents.btnAdd.click();
		await poOmnichannelAgents.inputSearch.fill('user1');
		await poOmnichannelAgents.findRowByUsername('user1').click();

		await poOmnichannelAgents.btnEdit.click();
		await poOmnichannelAgents.selectDepartment(department.data.name);
		await poOmnichannelAgents.btnSave.click();

		await test.step('expect the selected department is visible', async () => {
			await poOmnichannelAgents.findRowByUsername('user1').click();

			// mock the endpoint to use the one without pagination
			await page.route('/api/v1/livechat/department?showArchived=true', async (route) => {
				await route.fulfill({ json: { departments: [] } });
			});

			await poOmnichannelAgents.btnEdit.click();
			await expect(poOmnichannelAgents.findSelectedDepartment(department.data.name)).toBeVisible();
		});
	});
});
