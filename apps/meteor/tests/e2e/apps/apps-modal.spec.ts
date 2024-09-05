import type { Page } from '@playwright/test';

import { Users } from '../fixtures/userStates';
import { HomeChannel } from '../page-objects';
import { Modal } from '../page-objects/modal';
import { expect, test } from '../utils/test';

test.use({ storageState: Users.user1.state });

test.describe.serial('Apps > Modal', () => {
	let poHomeChannel: HomeChannel;
	let poModal: Modal;

	let page: Page;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();

		poHomeChannel = new HomeChannel(page);
		poModal = new Modal(page);

		await page.goto('/home');
		await poHomeChannel.sidenav.openChat('general');
	});

	test.afterAll(async () => {
		await page.close();
	});

	test('expect allow user open app modal', async () => {
		await poHomeChannel.content.dispatchSlashCommand('/modal');
		await expect(poModal.btnModalSubmit).toBeVisible();
	});

	test('expect validation error message appears in app modal', async () => {
		await expect(poModal.textInput).toBeVisible();

		await poModal.btnModalSubmit.click();

		await expect(poModal.textInputErrorMessage).toBeVisible();
	});

	test("expect validation error message don't appears in app modal", async () => {
		await poModal.textInput.fill('something');
		await poModal.btnModalSubmit.click();

		await expect(poModal.textInputErrorMessage).not.toBeVisible();
	});
});
