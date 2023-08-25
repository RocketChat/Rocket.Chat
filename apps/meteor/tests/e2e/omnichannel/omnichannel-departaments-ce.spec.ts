import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelDepartments } from '../page-objects';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.serial('omnichannel-departments', () => {
	test.skip(IS_EE, 'Community Edition Only');
	let poOmnichannelDepartments: OmnichannelDepartments;

	let departmentName: string;

	test.beforeAll(async () => {
		departmentName = faker.string.uuid();
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelDepartments = new OmnichannelDepartments(page);

		await page.goto('/omnichannel');
		await poOmnichannelDepartments.sidenav.linkDepartments.click();
	});

	test('CE departments', async () => {
		await test.step('expect create new department', async () => {
			await poOmnichannelDepartments.headingButtonNew('Create department').click();
			await poOmnichannelDepartments.btnEnabled.click();
			await poOmnichannelDepartments.inputName.fill(departmentName);
			await poOmnichannelDepartments.inputEmail.fill(faker.internet.email());
			await poOmnichannelDepartments.btnSave.click();
			await poOmnichannelDepartments.btnCloseToastSuccess.click();

			await poOmnichannelDepartments.inputSearch.fill(departmentName);
			await expect(poOmnichannelDepartments.firstRowInTable).toBeVisible();
		});
		await test.step('expect to not be possible adding a second department ', async () => {
			await poOmnichannelDepartments.headingButtonNew('Create department').click();

			await expect(poOmnichannelDepartments.upgradeDepartmentsModal).toBeVisible();

			await poOmnichannelDepartments.btnUpgradeDepartmentsModalClose.click();
		});
	});
});
