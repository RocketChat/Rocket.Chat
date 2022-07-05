import { test, expect, Page } from '@playwright/test';

import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { setupWizardStepRegex } from './utils/mocks/urlMock';
import { HOME_SELECTOR } from './utils/mocks/waitSelectorsMock';
import { LoginPage, SetupWizard } from './pageobjects';

test.describe('[Wizard]', () => {
	let setupWizard: SetupWizard;
	let loginPage: LoginPage;
	let page: Page;

	test.beforeEach(async ({ browser }) => {
		page = await browser.newPage();
		setupWizard = new SetupWizard(page);
		loginPage = new LoginPage(page);
	});

	test.describe('[Step 2]', async () => {
		test.beforeEach(async () => {
			await page.goto('/');
			await loginPage.doLogin(adminLogin, false);
		});

		test('expect required field alert showed when user dont inform data', async () => {
			await setupWizard.stepTwoFailedWithBlankFields();
		});

		test('expect go to Step 3 successfully', async () => {
			await setupWizard.stepTwoSuccess();
			await expect(setupWizard.page).toHaveURL(setupWizardStepRegex._3);
		});
	});

	test.describe('[Step 3]', async () => {
		test.beforeEach(async () => {
			await page.goto('');
			await loginPage.doLogin(adminLogin, false);
			await setupWizard.stepTwoSuccess();
		});

		test('expect have email field to register the server', async () => {
			await expect(setupWizard.registeredServer).toBeVisible();
		});

		test('expect start "Register" button disabled', async () => {
			await expect(setupWizard.registerButton).toBeDisabled();
		});

		test('expect show an error on invalid email', async () => {
			await setupWizard.stepThreeFailedWithInvalidField();
		});

		test('expect enable "Register" button when email is valid and terms checked', async () => {
			await setupWizard.registeredServer.type('mail@mail.com');
			await setupWizard.agreementField.click();
			await expect(setupWizard.registerButton).toBeEnabled();
		});

		test('expect have option for standalone server', async () => {
			await expect(setupWizard.standaloneServer).toBeVisible();
		});
	});

	test.describe('[Final Step]', async () => {
		test.beforeEach(async () => {
			await page.goto('');
			await loginPage.doLogin(adminLogin, false);
			await setupWizard.stepTwoSuccess();
			await setupWizard.stepThreeSuccess();
		});

		test('expect confirm the standalone option', async () => {
			await expect(setupWizard.goToWorkspace).toBeVisible();
			await expect(setupWizard.standaloneConfirmText).toBeVisible();
		});

		test('expect confirm standalone', async () => {
			await setupWizard.goToWorkspace.click();
			await page.waitForSelector(HOME_SELECTOR);
		});
	});
});
