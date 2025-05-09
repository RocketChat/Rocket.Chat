import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelBusinessHours } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { createBusinessHour } from '../utils/omnichannel/businessHours';
import { createDepartment } from '../utils/omnichannel/departments';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe('OC - Business Hours', () => {
	test.skip(!IS_EE, 'OC - Manage Business Hours > Enterprise Edition Only');

	let poOmnichannelBusinessHours: OmnichannelBusinessHours;
	let department: Awaited<ReturnType<typeof createDepartment>>;
	let department2: Awaited<ReturnType<typeof createDepartment>>;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	const BHid = faker.string.uuid();
	const BHName = 'TEST Business Hours';

	test.beforeAll(async ({ api }) => {
		department = await createDepartment(api);
		department2 = await createDepartment(api);
		agent = await createAgent(api, 'user2');
		await api.post('/settings/Livechat_enable_business_hours', { value: true }).then((res) => expect(res.status()).toBe(200));
		await api.post('/settings/Livechat_business_hour_type', { value: 'Multiple' }).then((res) => expect(res.status()).toBe(200));
	});

	test.afterAll(async ({ api }) => {
		await department.delete();
		await department2.delete();
		await agent.delete();
		await api.post('/settings/Livechat_enable_business_hours', { value: false }).then((res) => expect(res.status()).toBe(200));
		await api.post('/settings/Livechat_business_hour_type', { value: 'Single' }).then((res) => expect(res.status()).toBe(200));
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelBusinessHours = new OmnichannelBusinessHours(page);
	});

	test('OC - Manage Business Hours - Create Business Hours', async ({ page }) => {
		await page.goto('/omnichannel');
		await poOmnichannelBusinessHours.sidenav.linkBusinessHours.click();

		await test.step('expect correct form default state', async () => {
			await poOmnichannelBusinessHours.btnCreateBusinessHour.click();
			await poOmnichannelBusinessHours.btnBack.click();
			await expect(poOmnichannelBusinessHours.inputSearch).toBeVisible();
		});

		await test.step('expect to create a new business hours', async () => {
			await poOmnichannelBusinessHours.btnCreateBusinessHour.click();
			await poOmnichannelBusinessHours.inputName.fill(BHName);
			await poOmnichannelBusinessHours.selectDepartment(department.data);
			await poOmnichannelBusinessHours.btnSave.click();

			await test.step('expect business hours to have been created', async () => {
				await poOmnichannelBusinessHours.search(BHName);
				await expect(poOmnichannelBusinessHours.findRowByName(BHName)).toBeVisible();
			});
		});

		await test.step('expect to be able to delete business hours', async () => {
			await test.step('expect to be able to cancel delete', async () => {
				await poOmnichannelBusinessHours.btnDeleteByName(BHName).click();
				await expect(poOmnichannelBusinessHours.confirmDeleteModal).toBeVisible();
				await poOmnichannelBusinessHours.btnCancelDeleteModal.click();
				await expect(poOmnichannelBusinessHours.confirmDeleteModal).not.toBeVisible();
			});

			await test.step('expect to confirm delete', async () => {
				await poOmnichannelBusinessHours.btnDeleteByName(BHName).click();
				await expect(poOmnichannelBusinessHours.confirmDeleteModal).toBeVisible();
				await poOmnichannelBusinessHours.btnConfirmDeleteModal.click();
				await expect(poOmnichannelBusinessHours.confirmDeleteModal).not.toBeVisible();
			});
		});

		await test.step('expect business hours to have been deleted', async () => {
			await poOmnichannelBusinessHours.search(BHName);
			await expect(poOmnichannelBusinessHours.findRowByName(BHName)).not.toBeVisible();
		});
	});

	test('OC - Business hours - Edit BH departments', async ({ api, page }) => {
		await test.step('expect to create new businessHours', async () => {
			const createBH = await createBusinessHour(api, {
				id: BHid,
				name: BHName,
				departments: [department.data._id],
			});

			expect(createBH.status()).toBe(200);
		});

		await page.goto('/omnichannel');
		await poOmnichannelBusinessHours.sidenav.linkBusinessHours.click();

		await test.step('expect to add business hours departments', async () => {
			await poOmnichannelBusinessHours.search(BHName);
			await poOmnichannelBusinessHours.findRowByName(BHName).click();
			await poOmnichannelBusinessHours.selectDepartment({ name: department2.data.name, _id: department2.data._id });
			await poOmnichannelBusinessHours.btnSave.click();
		});

		await test.step('expect department to be in the chosen departments list', async () => {
			await poOmnichannelBusinessHours.search(BHName);
			await poOmnichannelBusinessHours.findRowByName(BHName).click();
			await expect(page.getByRole('option', { name: department2.data.name })).toBeVisible();
			await poOmnichannelBusinessHours.btnBack.click();
		});

		await test.step('expect to remove business hours departments', async () => {
			await poOmnichannelBusinessHours.search(BHName);
			await poOmnichannelBusinessHours.findRowByName(BHName).click();
			await poOmnichannelBusinessHours.selectDepartment({ name: department2.data.name, _id: department2.data._id });
			await poOmnichannelBusinessHours.btnSave.click();
		});

		await test.step('expect department to not be in the chosen departments list', async () => {
			await poOmnichannelBusinessHours.search(BHName);
			await poOmnichannelBusinessHours.findRowByName(BHName).click();
			await expect(page.getByRole('option', { name: department2.data.name })).toBeHidden();
			await poOmnichannelBusinessHours.btnBack.click();
		});

		await test.step('expect delete business hours', async () => {
			await poOmnichannelBusinessHours.btnDeleteByName(BHName).click();
			await expect(poOmnichannelBusinessHours.confirmDeleteModal).toBeVisible();
			await poOmnichannelBusinessHours.btnConfirmDeleteModal.click();
			await expect(poOmnichannelBusinessHours.confirmDeleteModal).not.toBeVisible();
		});
	});

	test('OC - Business hours - Toggle BH active status', async ({ api, page }) => {
		await test.step('expect to create new businessHours', async () => {
			const createBH = await createBusinessHour(api, {
				id: BHid,
				name: BHName,
				departments: [department.data._id],
			});

			expect(createBH.status()).toBe(200);
		});

		await page.goto('/omnichannel');
		await poOmnichannelBusinessHours.sidenav.linkBusinessHours.click();

		await test.step('expect to disable business hours', async () => {
			await poOmnichannelBusinessHours.sidenav.linkBusinessHours.click();

			await poOmnichannelBusinessHours.search(BHName);
			await poOmnichannelBusinessHours.findRowByName(BHName).click();

			await poOmnichannelBusinessHours.getCheckboxByLabel('Enabled').click();
			await expect(poOmnichannelBusinessHours.getCheckboxByLabel('Enabled')).not.toBeChecked();

			await poOmnichannelBusinessHours.btnSave.click();
		});

		await test.step('expect to enable business hours', async () => {
			await poOmnichannelBusinessHours.sidenav.linkBusinessHours.click();

			await poOmnichannelBusinessHours.search(BHName);
			await poOmnichannelBusinessHours.findRowByName(BHName).click();

			await poOmnichannelBusinessHours.getCheckboxByLabel('Enabled').click();
			await expect(poOmnichannelBusinessHours.getCheckboxByLabel('Enabled')).toBeChecked();

			await poOmnichannelBusinessHours.btnSave.click();
		});

		await test.step('expect delete business hours', async () => {
			await poOmnichannelBusinessHours.btnDeleteByName(BHName).click();
			await expect(poOmnichannelBusinessHours.confirmDeleteModal).toBeVisible();
			await poOmnichannelBusinessHours.btnConfirmDeleteModal.click();
		});
	});
});
