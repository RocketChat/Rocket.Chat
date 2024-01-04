import { faker } from '@faker-js/faker';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelSlaPolicies } from '../page-objects/omnichannel-sla-policies';
import { test, expect } from '../utils/test';

const ERROR = {
	nameRequired: 'The field Name is required.',
	estimatedWaitTimeRequired: 'The field Estimated wait time (time in minutes) is required.',
};

const INITIAL_SLA = {
	name: faker.person.firstName(),
	description: faker.lorem.sentence(),
	estimatedWaitTime: faker.string.numeric({ length: 1, exclude: '0' }),
};

const EDITED_SLA = {
	name: faker.person.firstName(),
	description: faker.lorem.sentence(),
	estimatedWaitTime: faker.string.numeric({ length: 1, exclude: '0' }),
};

test.skip(!IS_EE, 'Omnichannel SLA Policies > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe('Omnichannel SLA Policies', () => {
	let poOmnichannelSlaPolicies: OmnichannelSlaPolicies;

	test.beforeAll(async ({ api }) => {
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannelSlaPolicies = new OmnichannelSlaPolicies(page);

		await page.goto('/omnichannel');
		await poOmnichannelSlaPolicies.sidenav.linkSlaPolicies.click();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
	});

	test('Manage SLAs', async () => {
		await test.step('Add new SLA', async () => {
			await poOmnichannelSlaPolicies.headingButtonNew('Create SLA policy').click();

			await test.step('field name is required', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputName.fill('any_text');
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputName.fill('');
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.errorMessage(ERROR.nameRequired)).toBeVisible();
			});

			await test.step('input a valid name', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputName.fill(INITIAL_SLA.name);
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.errorMessage(ERROR.nameRequired)).not.toBeVisible();
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.btnSave).toBeDisabled();
			});

			await test.step('input a valid description', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputDescription.fill(INITIAL_SLA.description);
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.btnSave).toBeDisabled();
			});

			await test.step('only allow numbers on estimated wait time field', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputEstimatedWaitTime.type('a');
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.inputEstimatedWaitTime).toHaveValue('');
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.btnSave).toBeDisabled();
			});

			await test.step('not allow 0 on estimated wait time field', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputEstimatedWaitTime.fill('0');
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.errorMessage(ERROR.estimatedWaitTimeRequired)).toBeVisible();
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.btnSave).toBeDisabled();
			});

			await test.step('input a valid estimated wait time', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputEstimatedWaitTime.fill(INITIAL_SLA.estimatedWaitTime);
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.errorMessage(ERROR.estimatedWaitTimeRequired)).not.toBeVisible();
			});

			await test.step('save sla', async () => {
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.btnSave).toBeEnabled();
				await poOmnichannelSlaPolicies.manageSlaPolicy.btnSave.click();

				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.inputName).not.toBeVisible();
				await expect(poOmnichannelSlaPolicies.findRowByName(INITIAL_SLA.name)).toBeVisible();
			});
		});

		await test.step('Search SLA', async () => {
			await poOmnichannelSlaPolicies.inputSearch.type('random_text_that_should_have_no_match');
			await expect(poOmnichannelSlaPolicies.findRowByName(INITIAL_SLA.name)).not.toBeVisible();
			await expect(poOmnichannelSlaPolicies.txtEmptyState).toBeVisible();
			await poOmnichannelSlaPolicies.inputSearch.fill(INITIAL_SLA.name);
			await expect(poOmnichannelSlaPolicies.findRowByName(INITIAL_SLA.name)).toBeVisible();
			await expect(poOmnichannelSlaPolicies.txtEmptyState).not.toBeVisible();
			await poOmnichannelSlaPolicies.inputSearch.fill('');
		});

		await test.step('Edit SLA', async () => {
			await poOmnichannelSlaPolicies.findRowByName(INITIAL_SLA.name).click();

			await expect(poOmnichannelSlaPolicies.manageSlaPolicy.inputName).toHaveValue(INITIAL_SLA.name);
			await expect(poOmnichannelSlaPolicies.manageSlaPolicy.inputDescription).toHaveValue(INITIAL_SLA.description);
			await expect(poOmnichannelSlaPolicies.manageSlaPolicy.inputEstimatedWaitTime).toHaveValue(INITIAL_SLA.estimatedWaitTime);

			await test.step('edit name', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputName.fill(EDITED_SLA.name);
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.errorMessage(ERROR.nameRequired)).not.toBeVisible();
			});

			await test.step('edit description', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputDescription.fill(EDITED_SLA.description);
			});

			await test.step('edit estimated wait time', async () => {
				await poOmnichannelSlaPolicies.manageSlaPolicy.inputEstimatedWaitTime.fill(EDITED_SLA.estimatedWaitTime);
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.errorMessage(ERROR.estimatedWaitTimeRequired)).not.toBeVisible();
			});

			await test.step('save sla', async () => {
				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.btnSave).toBeEnabled();
				await poOmnichannelSlaPolicies.manageSlaPolicy.btnSave.click();

				await expect(poOmnichannelSlaPolicies.manageSlaPolicy.inputName).not.toBeVisible();
				await expect(poOmnichannelSlaPolicies.findRowByName(EDITED_SLA.name)).toBeVisible();
			});
		});

		await test.step('Remove SLA', async () => {
			await poOmnichannelSlaPolicies.btnRemove(EDITED_SLA.name).click();
			await expect(poOmnichannelSlaPolicies.txtDeleteModalTitle).toBeVisible();
			await poOmnichannelSlaPolicies.btnDelete.click();
			await expect(poOmnichannelSlaPolicies.findRowByName(EDITED_SLA.name)).not.toBeVisible();
		});
	});
});
