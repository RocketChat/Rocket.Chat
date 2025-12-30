import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelUnits } from '../page-objects/omnichannel';
import { createAgent } from '../utils/omnichannel/agents';
import { createDepartment } from '../utils/omnichannel/departments';
import { createMonitor } from '../utils/omnichannel/monitors';
import { createOrUpdateUnit } from '../utils/omnichannel/units';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe('OC - Manage Units', () => {
	test.skip(!IS_EE, 'OC - Manage Units > Enterprise Edition Only');

	let poOmnichannelUnits: OmnichannelUnits;

	let department: Awaited<ReturnType<typeof createDepartment>>;
	let department2: Awaited<ReturnType<typeof createDepartment>>;

	let agent: Awaited<ReturnType<typeof createAgent>>;

	let monitor: Awaited<ReturnType<typeof createMonitor>>;

	let monitor2: Awaited<ReturnType<typeof createMonitor>>;

	test.beforeAll(async ({ api }) => {
		department = await createDepartment(api);
		department2 = await createDepartment(api);
	});

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user2');
	});

	test.beforeAll(async ({ api }) => {
		monitor = await createMonitor(api, 'user2');
		monitor2 = await createMonitor(api, 'user3');
	});

	test.afterAll(async () => {
		await department.delete();
		await department2.delete();
		await monitor.delete();
		await monitor2.delete();
		await agent.delete();
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelUnits = new OmnichannelUnits(page);
		await page.goto('/omnichannel');
		await poOmnichannelUnits.sidebar.linkUnits.click();
	});

	test('OC - Manage Units - Create Unit', async ({ page }) => {
		const unitName = faker.string.uuid();

		await test.step('expect correct form default state', async () => {
			await poOmnichannelUnits.btnCreateUnit.click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();
			await expect(poOmnichannelUnits.editUnit.btnSave).toBeDisabled();
			await expect(poOmnichannelUnits.editUnit.btnCancel).toBeEnabled();
			await poOmnichannelUnits.editUnit.btnCancel.click();
			await expect(poOmnichannelUnits.editUnit.root).not.toBeVisible();
		});

		await test.step('expect to create new unit', async () => {
			await poOmnichannelUnits.btnCreateUnit.click();
			await poOmnichannelUnits.editUnit.inputName.fill(unitName);
			await poOmnichannelUnits.editUnit.selectVisibility('public');
			await poOmnichannelUnits.editUnit.selectDepartment(department.data.name);
			await poOmnichannelUnits.editUnit.selectMonitor('user2');
			await poOmnichannelUnits.editUnit.btnSave.click();
			await expect(poOmnichannelUnits.editUnit.root).not.toBeVisible();

			await poOmnichannelUnits.search(unitName);
			await expect(poOmnichannelUnits.table.findRowByName(unitName)).toBeVisible();
		});

		await test.step('expect to delete unit', async () => {
			await poOmnichannelUnits.deleteUnit(unitName);
			await expect(page.locator('h3 >> text="No units yet"')).toBeVisible();
		});
	});

	test('OC - Manage Units - Edit unit name', async ({ api, page }) => {
		const unitName = faker.string.uuid();
		const editedUnitName = faker.string.uuid();

		const unit = await test.step('expect to create new unit', async () => {
			const { data: newUnit } = await createOrUpdateUnit(api, {
				name: unitName,
				visibility: 'public',
				monitors: [{ monitorId: monitor.data._id, username: 'user2' }],
				departments: [{ departmentId: department.data._id }],
			});

			return newUnit;
		});

		await page.goto('/omnichannel');
		await poOmnichannelUnits.sidebar.linkUnits.click();

		await test.step('expect to edit unit', async () => {
			await poOmnichannelUnits.search(unit.name);
			await poOmnichannelUnits.table.findRowByName(unit.name).click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();
			await poOmnichannelUnits.editUnit.inputName.fill(editedUnitName);
			await poOmnichannelUnits.editUnit.btnSave.click();
			await expect(poOmnichannelUnits.editUnit.root).not.toBeVisible();
			await expect(poOmnichannelUnits.inputSearch).toBeVisible();
			await poOmnichannelUnits.search(editedUnitName);
			await expect(poOmnichannelUnits.table.findRowByName(editedUnitName)).toBeVisible();
		});

		await test.step('expect to add another monitor to list', async () => {
			await poOmnichannelUnits.table.findRowByName(editedUnitName).click();
			await poOmnichannelUnits.editUnit.selectMonitor('user3');
			await poOmnichannelUnits.editUnit.btnSave.click();
			await expect(poOmnichannelUnits.editUnit.root).not.toBeVisible();

			await poOmnichannelUnits.search(editedUnitName);
			await poOmnichannelUnits.table.findRowByName(editedUnitName).click();

			await expect(poOmnichannelUnits.editUnit.inputMonitors).toHaveText(/user2/);
			await expect(poOmnichannelUnits.editUnit.inputMonitors).toHaveText(/user3/);
		});

		await test.step('expect unit to remove one of the two monitors', async () => {
			await poOmnichannelUnits.search(editedUnitName);
			await poOmnichannelUnits.table.findRowByName(editedUnitName).click();
			await poOmnichannelUnits.editUnit.selectMonitor('user2');
			await poOmnichannelUnits.editUnit.btnSave.click();
			await expect(poOmnichannelUnits.editUnit.root).not.toBeVisible();

			await poOmnichannelUnits.search(editedUnitName);
			await poOmnichannelUnits.table.findRowByName(editedUnitName).click();
			await expect(poOmnichannelUnits.editUnit.inputMonitors).toHaveText(/user3/);
			await expect(poOmnichannelUnits.editUnit.inputMonitors).not.toHaveText(/user2/);
		});

		await test.step('expect to delete unit', async () => {
			await poOmnichannelUnits.table.findRowByName(editedUnitName).click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();

			await poOmnichannelUnits.editUnit.deleteUnit();
			await expect(poOmnichannelUnits.table.findRowByName(editedUnitName)).not.toBeVisible();
		});
	});

	test('OC - Manage Units - Edit unit departments', async ({ api, page }) => {
		const unit = await test.step('expect to create new unit', async () => {
			const { data: unit } = await createOrUpdateUnit(api, {
				name: faker.string.uuid(),
				visibility: 'public',
				monitors: [{ monitorId: monitor.data._id, username: 'user2' }],
				departments: [{ departmentId: department.data._id }],
			});

			return unit;
		});

		await page.reload();

		await test.step('expect to add unit departments', async () => {
			await poOmnichannelUnits.search(unit.name);
			await poOmnichannelUnits.table.findRowByName(unit.name).click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();
			await poOmnichannelUnits.editUnit.selectDepartment(department2.data.name);
			await poOmnichannelUnits.editUnit.btnSave.click();
			await expect(poOmnichannelUnits.editUnit.root).not.toBeVisible();

			await poOmnichannelUnits.search(unit.name);
			await poOmnichannelUnits.table.findRowByName(unit.name).click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();
			await expect(poOmnichannelUnits.editUnit.findDepartmentsChipOption(department2.data.name)).toBeVisible();
			await poOmnichannelUnits.editUnit.findDepartmentsChipOption(department2.data.name).hover();

			await expect(page.getByRole('tooltip', { name: department2.data.name })).toBeVisible();
			await poOmnichannelUnits.editUnit.close();
		});

		await test.step('expect to remove unit departments', async () => {
			await poOmnichannelUnits.search(unit.name);
			await poOmnichannelUnits.table.findRowByName(unit.name).click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();
			await poOmnichannelUnits.editUnit.selectDepartment(department2.data.name);
			await poOmnichannelUnits.editUnit.btnSave.click();
			await expect(poOmnichannelUnits.editUnit.root).not.toBeVisible();

			await poOmnichannelUnits.search(unit.name);
			await poOmnichannelUnits.table.findRowByName(unit.name).click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();
			await expect(poOmnichannelUnits.editUnit.findDepartmentsChipOption(department2.data.name)).toBeHidden();
			await poOmnichannelUnits.editUnit.close();
		});

		await test.step('expect to delete unit', async () => {
			await poOmnichannelUnits.search(unit.name);
			await poOmnichannelUnits.table.findRowByName(unit.name).click();
			await expect(poOmnichannelUnits.editUnit.root).toBeVisible();

			await poOmnichannelUnits.editUnit.deleteUnit();
			await expect(poOmnichannelUnits.table.findRowByName(unit.name)).not.toBeVisible();
		});
	});
});
