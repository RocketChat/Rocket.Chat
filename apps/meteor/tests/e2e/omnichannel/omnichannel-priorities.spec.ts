import { faker } from '@faker-js/faker';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelPriorities } from '../page-objects/omnichannel-priorities';
import { test, expect } from '../utils/test';

const PRIORITY_NAME = faker.person.firstName();

const ERROR = {
	fieldNameRequired: 'The field Name is required.',
};

test.skip(!IS_EE, 'Omnichannel Priorities > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe.serial('Omnichannel Priorities', () => {
	let poOmnichannelPriorities: OmnichannelPriorities;

	test.beforeAll(async ({ api }) => {
		await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannelPriorities = new OmnichannelPriorities(page);

		await page.goto('/omnichannel');
		await page.locator('.main-content').waitFor();
		await poOmnichannelPriorities.sidenav.linkPriorities.click();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([api.delete('/livechat/users/agent/user1'), api.delete('/livechat/users/manager/user1')]);
	});

	test('Manage Priorities', async () => {
		await test.step('All default priorities should be visible', async () => {
			await Promise.all([
				expect(poOmnichannelPriorities.findPriority('Highest')).toBeVisible(),
				expect(poOmnichannelPriorities.findPriority('High')).toBeVisible(),
				expect(poOmnichannelPriorities.findPriority('Medium')).toBeVisible(),
				expect(poOmnichannelPriorities.findPriority('Low')).toBeVisible(),
				expect(poOmnichannelPriorities.findPriority('Lowest')).toBeVisible(),
			]);
		});

		await test.step('Add new priority', async () => {
			await expect(poOmnichannelPriorities.btnReset).toBeDisabled();
			await poOmnichannelPriorities.findPriority('Highest').click();

			await test.step('default state', async () => {
				await Promise.all([
					expect(poOmnichannelPriorities.managePriority.btnSave).toBeDisabled(),
					expect(poOmnichannelPriorities.managePriority.btnReset).not.toBeVisible(),
					expect(poOmnichannelPriorities.managePriority.inputName).toHaveValue('Highest'),
				]);
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
				await Promise.all([
					expect(poOmnichannelPriorities.managePriority.btnReset).toBeVisible(),
					expect(poOmnichannelPriorities.managePriority.btnSave).toBeEnabled(),
				]);
				await poOmnichannelPriorities.managePriority.btnSave.click();

				await Promise.all([
					poOmnichannelPriorities.btnCloseToastSuccess.click(),
					expect(poOmnichannelPriorities.managePriority.inputName).not.toBeVisible(),
					expect(poOmnichannelPriorities.findPriority(PRIORITY_NAME)).toBeVisible(),
					expect(poOmnichannelPriorities.findPriority('Highest')).not.toBeVisible(),
				]);
			});
		});

		await test.step('Reset priority', async () => {
			await test.step('reset individual', async () => {
				await poOmnichannelPriorities.findPriority(PRIORITY_NAME).click();
				await expect(poOmnichannelPriorities.managePriority.btnReset).toBeVisible();
				await poOmnichannelPriorities.managePriority.btnReset.click();
				await Promise.all([
					expect(poOmnichannelPriorities.managePriority.inputName).toHaveValue('Highest'),
					expect(poOmnichannelPriorities.managePriority.btnReset).not.toBeVisible(),
				]);

				await expect(poOmnichannelPriorities.managePriority.btnSave).toBeEnabled();
				await poOmnichannelPriorities.managePriority.btnSave.click();
				await poOmnichannelPriorities.btnCloseToastSuccess.click();
				await expect(poOmnichannelPriorities.findPriority('Highest')).toBeVisible();
				await expect(poOmnichannelPriorities.btnReset).not.toBeEnabled();
			});

			await test.step('reset all', async () => {
				await poOmnichannelPriorities.findPriority('Highest').click();

				await poOmnichannelPriorities.managePriority.inputName.fill(PRIORITY_NAME);
				await Promise.all([
					expect(poOmnichannelPriorities.managePriority.btnReset).toBeVisible(),
					expect(poOmnichannelPriorities.managePriority.btnSave).toBeEnabled(),
				]);
				await poOmnichannelPriorities.managePriority.btnSave.click();
				await poOmnichannelPriorities.btnCloseToastSuccess.click();
				await Promise.all([
					expect(poOmnichannelPriorities.managePriority.inputName).not.toBeVisible(),
					expect(poOmnichannelPriorities.findPriority(PRIORITY_NAME)).toBeVisible(),
					expect(poOmnichannelPriorities.findPriority('Highest')).not.toBeVisible(),
				]);

				await expect(poOmnichannelPriorities.btnReset).toBeEnabled();
				await poOmnichannelPriorities.btnReset.click();
				await poOmnichannelPriorities.btnResetConfirm.click();

				await Promise.all([
					expect(poOmnichannelPriorities.toastSuccess).toBeVisible(),
					expect(poOmnichannelPriorities.btnReset).not.toBeEnabled(),
					expect(poOmnichannelPriorities.findPriority(PRIORITY_NAME)).not.toBeVisible(),
					expect(poOmnichannelPriorities.findPriority('Highest')).toBeVisible(),
				]);
			});
		});
	});
});
