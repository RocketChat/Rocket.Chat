import faker from '@faker-js/faker';

import { IS_EE } from './config/constants';
import { OmnichannelPriorities } from './page-objects/omnichannel-priorities';
import { test, expect } from './utils/test';

const PRIORITY_NAME = faker.name.firstName();

const ERROR = {
	fieldNameRequired: 'The field Name is required.',
};

test.skip(!IS_EE, 'Omnichannel Priorities > Enterprise Only');

test.use({ storageState: 'user1-session.json' });

test.describe.serial('Omnichannel Priorities', () => {
	let poOmnichannelPriorities: OmnichannelPriorities;

	test.beforeAll(async ({ api }) => {
		await api.post('/livechat/users/agent', { username: 'user1' });
		await api.post('/livechat/users/manager', { username: 'user1' });
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannelPriorities = new OmnichannelPriorities(page);

		await page.goto('/omnichannel');
		await poOmnichannelPriorities.sidenav.linkPriorities.click();
	});

	test.afterAll(async ({ api }) => {
		await api.delete('/livechat/users/agent/user1');
		await api.delete('/livechat/users/manager/user1');
	});

	test('Manage Priorities', async () => {
		await test.step('All default priorities should be visible', async () => {
			await expect(poOmnichannelPriorities.findPriority('Highest')).toBeVisible();
			await expect(poOmnichannelPriorities.findPriority('High')).toBeVisible();
			await expect(poOmnichannelPriorities.findPriority('Medium')).toBeVisible();
			await expect(poOmnichannelPriorities.findPriority('Low')).toBeVisible();
			await expect(poOmnichannelPriorities.findPriority('Lowest')).toBeVisible();
		});

		await test.step('Add new priority', async () => {
			await expect(poOmnichannelPriorities.btnReset).toBeDisabled();
			await poOmnichannelPriorities.findPriority('Highest').click();

			await test.step('default state', async () => {
				await expect(poOmnichannelPriorities.managePriority.btnSave).toBeDisabled();
				await expect(poOmnichannelPriorities.managePriority.btnReset).not.toBeVisible();
				await expect(poOmnichannelPriorities.managePriority.inputName).toHaveValue('Highest');
			});

			await test.step('field name is required', async () => {
				await poOmnichannelPriorities.managePriority.inputName.fill('any_text');
				await expect(poOmnichannelPriorities.managePriority.btnSave).toBeEnabled();
				await poOmnichannelPriorities.managePriority.inputName.fill('');
				await expect(poOmnichannelPriorities.managePriority.errorMessage(ERROR.fieldNameRequired)).toBeVisible();
				await expect(poOmnichannelPriorities.managePriority.btnSave).toBeDisabled();
			});

			await test.step('edit and save priority', async () => {
				await poOmnichannelPriorities.managePriority.inputName.fill(PRIORITY_NAME);
				await expect(poOmnichannelPriorities.managePriority.btnReset).toBeVisible();
				await expect(poOmnichannelPriorities.managePriority.btnSave).toBeEnabled();
				await poOmnichannelPriorities.managePriority.btnSave.click();

				await expect(poOmnichannelPriorities.managePriority.inputName).not.toBeVisible();
				await expect(poOmnichannelPriorities.findPriority(PRIORITY_NAME)).toBeVisible();
				await expect(poOmnichannelPriorities.findPriority('Highest')).not.toBeVisible();
			});
		});

		await test.step('Reset priority', async () => {
			await test.step('reset individual', async () => {
				await poOmnichannelPriorities.findPriority(PRIORITY_NAME).click();
				await expect(poOmnichannelPriorities.managePriority.btnReset).toBeVisible();
				await poOmnichannelPriorities.managePriority.btnReset.click();
				await expect(poOmnichannelPriorities.managePriority.inputName).toHaveValue('Highest');
				await expect(poOmnichannelPriorities.managePriority.btnReset).not.toBeVisible();

				await expect(poOmnichannelPriorities.managePriority.btnSave).toBeEnabled();
				await poOmnichannelPriorities.managePriority.btnSave.click();
				await expect(poOmnichannelPriorities.findPriority('Highest')).toBeVisible();
				await expect(poOmnichannelPriorities.btnReset).not.toBeEnabled();
			});

			await test.step('reset all', async () => {
				await poOmnichannelPriorities.findPriority('Highest').click();

				await poOmnichannelPriorities.managePriority.inputName.fill(PRIORITY_NAME);
				await expect(poOmnichannelPriorities.managePriority.btnReset).toBeVisible();
				await expect(poOmnichannelPriorities.managePriority.btnSave).toBeEnabled();
				await poOmnichannelPriorities.managePriority.btnSave.click();

				await expect(poOmnichannelPriorities.managePriority.inputName).not.toBeVisible();
				await expect(poOmnichannelPriorities.findPriority(PRIORITY_NAME)).toBeVisible();
				await expect(poOmnichannelPriorities.findPriority('Highest')).not.toBeVisible();

				await expect(poOmnichannelPriorities.btnReset).toBeEnabled();
				await poOmnichannelPriorities.btnReset.click();
				await poOmnichannelPriorities.btnResetConfirm.click();
				await expect(poOmnichannelPriorities.toastSuccess).toBeVisible();

				await expect(poOmnichannelPriorities.btnReset).not.toBeEnabled();
				await expect(poOmnichannelPriorities.findPriority(PRIORITY_NAME)).not.toBeVisible();
				await expect(poOmnichannelPriorities.findPriority('Highest')).toBeVisible();
			});
		});
	});
});
