import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { AppsModal } from '../page-objects/fragments/modals';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Apps > Modal', () => {
	test.skip(!IS_EE, 'Premium Only');
	let poHomeChannel: HomeChannel;
	let poModal: AppsModal;

	let page: Page;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();

		poHomeChannel = new HomeChannel(page);
		poModal = new AppsModal(page);

		await page.goto('/home');
		await poHomeChannel.navbar.openChat('general');
	});

	test.afterAll(async () => {
		await page.close();
	});

	test('should allow user open app modal', async () => {
		await poHomeChannel.content.dispatchSlashCommand('/modal');
		await poModal.waitForDisplay();
	});

	test('should display validation error message in app modal', async () => {
		await poModal.btnSubmit.click();
		await expect(poModal.textInputErrorMessage).toBeVisible();
	});

	test('should not display validation error message in app modal', async () => {
		await poModal.submit('something');
	});
});
