import { test, expect } from '@playwright/test';

import SetupWizard from './utils/pageobjects/wizard.page';
import { adminUsername, adminPassword } from './utils/mocks/userAndPasswordMock';

test.describe('[Wizard]', () => {
	let setupWizard: SetupWizard;

	test.beforeAll(async ({ browser, baseURL }) => {
		setupWizard = new SetupWizard(browser, baseURL as string);
		await setupWizard.open('');
	});

	test.describe('[Step 1]', () => {
		test.beforeEach(async () => {
			await setupWizard.goto('');
		});

		test('expect required field alert showed when user dont inform data', async () => {
			await setupWizard.goNext();

			await expect(setupWizard.fullNameIvalidtext()).toBeVisible();
			await expect(setupWizard.userNameInvalidText()).toBeVisible();
			await expect(setupWizard.companyEmailInvalidText()).toBeVisible();
			await expect(setupWizard.passwordInvalidText()).toBeVisible();
		});

		test('expect alert showed when email provided is invalid', async () => {
			await setupWizard.fullName().type('Any admin Name');
			await setupWizard.userName().type(adminUsername);
			await setupWizard.companyEmail().type('useremail');
			await setupWizard.password().type(adminPassword);

			await setupWizard.goNext();

			await expect(setupWizard.companyEmail()).toBeFocused();
		});

		test('expect go to Step 2 successfully', async () => {
			await setupWizard.stepOneSucess();

			await expect(setupWizard.getPage()).toHaveURL(/.*\/setup-wizard\/2/);
		});
	});

	test.describe('[Step 2]', async () => {
		test.beforeEach(async () => {
			await setupWizard.goto('');
			await setupWizard.stepOneSucess();
		});

		test('expect required field alert showed when user dont inform data', async () => {
			await setupWizard.goNext();

			await expect(setupWizard.organizationName()).toBeVisible();
			await expect(setupWizard.industryInvalidSelect()).toBeVisible();
			await expect(setupWizard.sizeInvalidSelect()).toBeVisible();
			await expect(setupWizard.countryInvalidSelect()).toBeVisible();
		});

		test('expect go to Step 3 successfully', async () => {
			await setupWizard.stepTwoSucess();
			await expect(setupWizard.getPage()).toHaveURL(/.*\/setup-wizard\/3/);
		});
	});

	test.describe.only('[Step 3]', async () => {
		test.beforeEach(async () => {
			await setupWizard.goto('');
			await setupWizard.stepOneSucess();
			await setupWizard.stepTwoSucess();
		});

		test('expect have email field to register the server', async () => {
			await expect(setupWizard.registeredServer()).toBeVisible();
		});

		test('expect start wtesth "Register" button disabled', async () => {
			await expect(setupWizard.registerButton()).toBeDisabled();
		});

		test('expect show an error on invalid email', async () => {
			await setupWizard.registeredServer().type('a');
			await setupWizard.registeredServer().click({ clickCount: 3 });
			await setupWizard.getPage().keyboard.press('Backspace');

			await expect(
				setupWizard.getPage().locator('//input[@name="email"]/../../span[contains(text(), "This field is required")]'),
			).toBeVisible();
		});

		test('expect enable "Register" button when email is valid and terms checked', async () => {
			await setupWizard.registeredServer().type('email@email.com');
			await setupWizard.agreementField().click();
			await expect(setupWizard.registerButton()).toBeEnabled();
		});

		test('expect have option for standalone server', async () => {
			await expect(setupWizard.standaloneServer()).toBeVisible();
		});
	});

	test.describe.only('[Final Step]', async () => {
		test.beforeEach(async () => {
			await setupWizard.goto('');
			await setupWizard.stepOneSucess();
			await setupWizard.stepTwoSucess();
			await setupWizard.stepThreeSucess();
		});

		test('expect confirm the standalone option', async () => {
			await expect(setupWizard.goToWorkspace()).toBeVisible();
			await expect(setupWizard.standaloneConfirmText()).toBeVisible();
		});

		test('expect confirm standalone', async () => {
			await setupWizard.goToWorkspace().click();
		});
	});
});
