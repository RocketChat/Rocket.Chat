import { createFakeDepartment } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelAgents } from '../page-objects/omnichannel';
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
		await poOmnichannelAgents.sidebar.linkAgents.click();
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

			await poOmnichannelAgents.search('user1');
			await expect(poOmnichannelAgents.table.findRowByName('user1')).toBeVisible();
		});

		await test.step('expect remove "user1" as agent', async () => {
			await poOmnichannelAgents.search('user1');
			await poOmnichannelAgents.deleteAgent('user1');

			await poOmnichannelAgents.search('user1');
			await expect(poOmnichannelAgents.table.findRowByName('user1')).not.toBeVisible();
		});
	});

	test('OC - Manage Agents [CE]- Edit and Remove', async () => {
		test.skip(IS_EE, 'Community Edition Only');

		await poOmnichannelAgents.selectUsername('user1');
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.search('user1');
		await poOmnichannelAgents.table.findRowByName('user1').click();
		await poOmnichannelAgents.agentInfo.btnEdit.click();

		await test.step('expect max chats fields to be hidden', async () => {
			await expect(poOmnichannelAgents.editAgent.inputMaxChats).toBeHidden();
		});

		await test.step('expect update "user1" information', async () => {
			await poOmnichannelAgents.editAgent.selectStatus('Not available');
			await poOmnichannelAgents.editAgent.selectDepartment(department.data.name);
			await poOmnichannelAgents.editAgent.btnSave.click();
		});

		await test.step('expect removing "user1" via sidebar', async () => {
			await poOmnichannelAgents.search('user1');
			await poOmnichannelAgents.table.findRowByName('user1').click();
			await poOmnichannelAgents.agentInfo.btnRemove.click();
		});
	});

	test('OC - Manage Agents [EE] - Edit ', async () => {
		test.skip(!IS_EE, 'Enterprise Only');

		await poOmnichannelAgents.selectUsername('user1');
		await poOmnichannelAgents.btnAdd.click();

		await poOmnichannelAgents.search('user1');
		await poOmnichannelAgents.table.findRowByName('user1').click();
		await poOmnichannelAgents.agentInfo.btnEdit.click();

		await test.step('expect max chats field to be visible', async () => {
			await expect(poOmnichannelAgents.editAgent.inputMaxChats).toBeVisible();
		});

		await test.step('expect update "user1" information', async () => {
			await poOmnichannelAgents.editAgent.inputMaxChats.click();
			await poOmnichannelAgents.editAgent.inputMaxChats.fill('2');
			await poOmnichannelAgents.editAgent.btnSave.click();
		});
	});

	test('OC - Edit agent  - Manage departments', async ({ page }) => {
		await poOmnichannelAgents.selectUsername('user1');
		await poOmnichannelAgents.btnAdd.click();
		await poOmnichannelAgents.search('user1');
		await poOmnichannelAgents.table.findRowByName('user1').click();

		await poOmnichannelAgents.agentInfo.btnEdit.click();
		await poOmnichannelAgents.editAgent.selectDepartment(department.data.name);
		const response = page.waitForResponse('**/api/v1/livechat/agents.saveInfo');
		await poOmnichannelAgents.editAgent.btnSave.click();

		/**
		 * between saving and opening the agent info again it is necessary to
		 * wait for the agent to be saved, since after successfully saving
		 * the contextual bar is closed
		 * otherwise content will be closed even if the current one is not the editing one
		 */

		await response;

		await expect(poOmnichannelAgents.editAgent.root).not.toBeVisible();

		await test.step('expect the selected department is visible', async () => {
			await poOmnichannelAgents.table.findRowByName('user1').click();

			// mock the endpoint to use the one without pagination
			await page.route('/api/v1/livechat/department?showArchived=true', async (route) => {
				await route.fulfill({ json: { departments: [] } });
			});

			await poOmnichannelAgents.agentInfo.btnEdit.click();
			await expect(poOmnichannelAgents.editAgent.findSelectedDepartment(department.data.name)).toBeVisible();
		});
	});

	test('OC - Edit agent  - Departments pagination', async ({ page }) => {
		const data = Array.from({ length: 100 }, (_, i) => createFakeDepartment({ name: `Department ${i}` }));
		await page.route('**/v1/livechat/department*', async (route, request) => {
			const url = new URL(request.url());
			const offset = parseInt(url.searchParams.get('offset') || '0', 10);
			const count = parseInt(url.searchParams.get('count') || '50', 10);
			const departments = data.slice(offset, offset + count);

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ departments, offset, count, total: data.length }),
			});
		});

		await test.step('expect to add agent', async () => {
			await poOmnichannelAgents.selectUsername('user1');
			await poOmnichannelAgents.btnAdd.click();
		});

		await test.step('expect to edit agent', async () => {
			await poOmnichannelAgents.search('user1');
			await poOmnichannelAgents.table.findRowByName('user1').click();
			await poOmnichannelAgents.agentInfo.btnEdit.click();
		});

		await test.step('expect department field to be paginated', async () => {
			await poOmnichannelAgents.editAgent.inputDepartment.click();
			await expect(poOmnichannelAgents.editAgent.getDepartmentOption('Department 0')).toBeVisible();
			await poOmnichannelAgents.scrollToListBottom();
			await expect(poOmnichannelAgents.editAgent.getDepartmentOption('Department 49')).toBeVisible();
			await poOmnichannelAgents.scrollToListBottom();
			await expect(poOmnichannelAgents.editAgent.getDepartmentOption('Department 99')).toBeVisible();
			await poOmnichannelAgents.editAgent.close();
		});

		await test.step('expect remove "user1" as agent', async () => {
			await poOmnichannelAgents.search('user1');
			await poOmnichannelAgents.deleteAgent('user1');

			await poOmnichannelAgents.search('user1');
			await expect(poOmnichannelAgents.table.findRowByName('user1')).not.toBeVisible();
		});
	});
});
