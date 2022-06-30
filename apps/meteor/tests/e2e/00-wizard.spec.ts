import { test, expect, Page } from '@playwright/test';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { Wizard } from './pageobjects';

test.describe('[Wizard]', () => {
	let wizard: Wizard;
	let page: Page;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		wizard = new Wizard(page);
	});

	test.describe('[Step 2]', async () => {
		test.beforeAll(async () => {
			await page.goto('');
			await wizard.login.doLogin(adminLogin, false);
		});

		test('expect required field alert showed when user not inform data', async () => {
			await wizard.getBtnPrimary({ text: 'Next' }).click();
			for await (const nthElement of [0, 1, 2, 3]) {
				await expect(wizard.textInvalidInput({ nthElement })).toBeVisible();
			}
		});

		test('expect go to Step 3 successfully', async () => {
			await wizard.doGoToStepTwoSuccess();
			await expect(wizard.page).toHaveURL(/.*\/setup-wizard\/3/);
		});
	});

	test.describe('[Step 3]', async () => {
		test('expect start "Register" button disabled', async () => {
			await expect(wizard.getBtnPrimary({ text: 'Register' })).toBeDisabled();
		});

		test('expect not advance step with invalid email', async () => {
			await wizard.registeredServer.fill('mail');
			await wizard.doClickAgreementField();
			await expect(wizard.page).toHaveURL(/.*\/setup-wizard\/3/);
		});

		test('expect enable "Register" button when email is valid and terms checked', async () => {
			await wizard.registeredServer.fill('mail@mail.com');
			await expect(wizard.getBtnPrimary({ text: 'Register' })).toBeEnabled();
		});

		test('expect have option for standalone server', async () => {
			await expect(wizard.btnStandaloneServer).toBeVisible();
			await page.pause();
		});
	});

	test.describe('[Final Step]', async () => {
		test.beforeAll(async () => {
			await wizard.btnStandaloneServer.click();
		});

		test('expect confirm the standalone option', async () => {
			await expect(wizard.textStandaloneServerConfirmation).toBeVisible();
		});

		test('expect confirm standalone', async () => {
			await wizard.getBtnPrimary({ text: 'Confirm' }).click();
			await expect(wizard.page.locator('[data-qa="sidebar-avatar-button"]')).toBeVisible();
		});
	});
});
