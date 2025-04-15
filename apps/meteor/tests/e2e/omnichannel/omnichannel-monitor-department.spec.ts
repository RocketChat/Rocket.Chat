import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelDepartments } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { createDepartment } from '../utils/omnichannel/departments';
import { createMonitor } from '../utils/omnichannel/monitors';
import { createOrUpdateUnit } from '../utils/omnichannel/units';
import { test, expect } from '../utils/test';

const MONITOR = 'user3';

test.use({ storageState: Users.user3.state });

test.describe.serial('OC - Monitor Role', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');

	let departments: Awaited<ReturnType<typeof createDepartment>>[];
	let agents: Awaited<ReturnType<typeof createAgent>>[];
	let monitor: Awaited<ReturnType<typeof createMonitor>>;
	let units: Awaited<ReturnType<typeof createOrUpdateUnit>>[];
	let poOmnichannelDepartments: OmnichannelDepartments;
	const newDepartmentName = faker.string.uuid();

	// Reset user3 roles
	test.beforeAll(async ({ api }) => {
		const res = await api.post('/users.update', { data: { roles: ['user'] }, userId: MONITOR });
		await expect(res.status()).toBe(200);
	});

	// Create agents
	test.beforeAll(async ({ api }) => {
		agents = await Promise.all([createAgent(api, 'user1'), createAgent(api, 'user2')]);
	});

	// Create department
	test.beforeAll(async ({ api }) => {
		departments = await Promise.all([createDepartment(api), createDepartment(api)]);
	});

	// Create monitor
	test.beforeAll(async ({ api }) => {
		monitor = await createMonitor(api, MONITOR);
	});

	// Create unit
	test.beforeAll(async ({ api }) => {
		const [departmentA, departmentB] = departments.map((dep) => dep.data);

		units = await Promise.all([
			await createOrUpdateUnit(api, {
				monitors: [{ monitorId: 'user2', username: 'user2' }],
				departments: [{ departmentId: departmentB._id }],
			}),
			await createOrUpdateUnit(api, {
				monitors: [{ monitorId: MONITOR, username: MONITOR }],
				departments: [{ departmentId: departmentA._id }],
			}),
			await createOrUpdateUnit(api, {
				monitors: [{ monitorId: MONITOR, username: MONITOR }],
				departments: [{ departmentId: departmentA._id }],
			}),
		]);
	});

	// Delete all created data
	test.afterAll(async () => {
		await Promise.all([
			...agents.map((agent) => agent.delete()),
			...departments.map((department) => department.delete()),
			...units.map((unit) => unit.delete()),
			monitor.delete(),
		]);
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelDepartments = new OmnichannelDepartments(page);

		await page.goto('/omnichannel/departments');
	});

	test('OC - Monitor Role - Create department with business unit', async () => {
		const [departmentA] = departments.map((dep) => dep.data);
		const [unitA, unitB, unitC] = units.map((unit) => unit.data);

		await test.step('expect to see only departmentA in the list', async () => {
			await expect(poOmnichannelDepartments.findDepartment(departmentA.name)).toBeVisible();
		});

		await test.step('expect to fill departments mandatory field', async () => {
			await poOmnichannelDepartments.headingButtonNew('Create department').click();
			await poOmnichannelDepartments.inputName.fill(newDepartmentName);
			await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
		});

		await test.step('expect to only have the units from monitor visible', async () => {
			await expect(poOmnichannelDepartments.inputUnit).not.toBeDisabled();
			await poOmnichannelDepartments.inputUnit.click();
			await expect(poOmnichannelDepartments.findOption(unitA.name)).not.toBeVisible();
			await expect(poOmnichannelDepartments.findOption(unitB.name)).toBeVisible();
			await expect(poOmnichannelDepartments.findOption(unitC.name)).toBeVisible();
		});

		await test.step('expect to be able to switch freely between available units', async () => {
			await poOmnichannelDepartments.findOption(unitC.name).click();
			await expect(poOmnichannelDepartments.inputUnit).not.toBeDisabled();
			await poOmnichannelDepartments.inputUnit.click();
			await poOmnichannelDepartments.findOption(unitB.name).click();
		});

		await test.step('expect unit field to be required', async () => {
			await poOmnichannelDepartments.inputUnit.click();
			await poOmnichannelDepartments.findOption('None').click();
			await expect(poOmnichannelDepartments.btnSave).toBeDisabled();
			await expect(poOmnichannelDepartments.errorMessage('Unit required')).toBeVisible();
			await poOmnichannelDepartments.inputUnit.click();
			await poOmnichannelDepartments.findOption(unitB.name).click();
			await expect(poOmnichannelDepartments.btnSave).toBeEnabled();
		});

		await test.step('expect to save department', async () => {
			await poOmnichannelDepartments.btnEnabled.click();
			await poOmnichannelDepartments.btnSave.click();
		});

		await test.step('expect to have departmentA and departmentB visible', async () => {
			await expect(poOmnichannelDepartments.findDepartment(departmentA.name)).toBeVisible();
			await expect(poOmnichannelDepartments.findDepartment(newDepartmentName)).toBeVisible();
		});
	});

	test('OC - Monitor Role - Not allow editing department business unit', async () => {
		await test.step('expect not to be able to edit unit', async () => {
			await poOmnichannelDepartments.search(newDepartmentName);
			await poOmnichannelDepartments.selectedDepartmentMenu(newDepartmentName).click();
			await poOmnichannelDepartments.menuEditOption.click();
			await expect(poOmnichannelDepartments.inputUnit).toBeDisabled();
		});
	});

	// TODO: We are going to prevent editing busines unit for now
	test.skip('OC - Monitor Role - Edit department business unit', async () => {
		const [departmentA] = departments.map((dep) => dep.data);
		const [, , unitC] = units.map((unit) => unit.data);

		await test.step('expect to edit unit', async () => {
			await poOmnichannelDepartments.search(newDepartmentName);
			await poOmnichannelDepartments.selectedDepartmentMenu(newDepartmentName).click();
			await poOmnichannelDepartments.menuEditOption.click();
			await poOmnichannelDepartments.selectUnit(unitC.name);
			await poOmnichannelDepartments.btnEnabled.click();
			await poOmnichannelDepartments.btnSave.click();
		});

		await test.step('expect departmentB to still be visible', async () => {
			await expect(poOmnichannelDepartments.findDepartment(departmentA.name)).toBeVisible();
			await expect(poOmnichannelDepartments.findDepartment(newDepartmentName)).toBeVisible();
		});
	});

	test.skip('OC - Monitor Role - Edit department and remove business unit', async () => {
		const [departmentA] = departments.map((dep) => dep.data);

		await test.step('expect to edit unit', async () => {
			await poOmnichannelDepartments.search(newDepartmentName);
			await poOmnichannelDepartments.selectedDepartmentMenu(newDepartmentName).click();
			await poOmnichannelDepartments.menuEditOption.click();
			await poOmnichannelDepartments.selectUnit('None');
			await poOmnichannelDepartments.btnEnabled.click();
			await poOmnichannelDepartments.btnSave.click();
		});

		await test.step('expect departmentB to not be visible', async () => {
			await expect(poOmnichannelDepartments.findDepartment(departmentA.name)).toBeVisible();
			await expect(poOmnichannelDepartments.findDepartment(newDepartmentName)).not.toBeVisible();
		});
	});
});
