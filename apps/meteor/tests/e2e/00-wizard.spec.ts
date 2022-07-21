import { test, expect, Locator, Page } from '@playwright/test';

import { Auth } from './page-objects';
import { ADMIN_CREDENTIALS } from './utils/constants';

class SetupWizard {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	private get nextStep(): Locator {
		return this.page.locator('//button[contains(text(), "Next")]');
	}

	private get fullName(): Locator {
		return this.page.locator('[name="fullname"]');
	}

	private get userName(): Locator {
		return this.page.locator('[name="username"]');
	}

	private get companyEmail(): Locator {
		return this.page.locator('[name="companyEmail"]');
	}

	private get password(): Locator {
		return this.page.locator('[name="password"]');
	}

	get goToWorkspace(): Locator {
		return this.page.locator('//button[contains(text(), "Confirm")]');
	}

	get organizationType(): Locator {
		return this.page.locator('[name="organizationType"]');
	}

	get organizationTypeSelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	get organizationName(): Locator {
		return this.page.locator('[name="organizationName"]');
	}

	get industry(): Locator {
		return this.page.locator('[name="organizationIndustry"]');
	}

	get industrySelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	get size(): Locator {
		return this.page.locator('[name="organizationSize"]');
	}

	get sizeSelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	get country(): Locator {
		return this.page.locator('[name="country"]');
	}

	get countrySelect(): Locator {
		return this.page.locator('.rcx-options .rcx-option:first-child');
	}

	get registeredServer(): Locator {
		return this.page.locator('input[name=email]');
	}

	get registerButton(): Locator {
		return this.page.locator('//button[contains(text(), "Register")]');
	}

	get agreementField(): Locator {
		return this.page.locator('//input[@name="agreement"]/../i[contains(@class, "rcx-check-box")]');
	}

	get standaloneServer(): Locator {
		return this.page.locator('//a[contains(text(), "Continue as standalone")]');
	}

	get standaloneConfirmText(): Locator {
		return this.page.locator('//*[contains(text(), "Standalone Server Confirmation")]');
	}

	get fullNameInvalidText(): Locator {
		return this.page.locator('//input[@name="fullname"]/../following-sibling::span');
	}

	get userNameInvalidText(): Locator {
		return this.page.locator('//input[@name="username"]/../following-sibling::span');
	}

	get companyEmailInvalidText(): Locator {
		return this.page.locator('//input[@name="companyEmail"]/../following-sibling::span');
	}

	get passwordInvalidText(): Locator {
		return this.page.locator('//input[@name="password"]/../../../span[contains(@class, "rcx-field__error")]');
	}

	get industryInvalidSelect(): Locator {
		return this.page.locator('//div[@name="organizationIndustry"]/../following-sibling::span');
	}

	get sizeInvalidSelect(): Locator {
		return this.page.locator('//div[@name="organizationSize"]/../following-sibling::span');
	}

	get countryInvalidSelect(): Locator {
		return this.page.locator('//div[@name="country"]/../following-sibling::span');
	}

	get stepThreeInputInvalidMail(): Locator {
		return this.page.locator('//input[@name="email"]/../../span[contains(text(), "This field is required")]');
	}

	async stepTwoSuccess(): Promise<void> {
		await this.organizationName.type('rocket.chat.reason');
		await this.organizationType.click();
		await this.organizationTypeSelect.click();
		await expect(this.page.locator('.rcx-options')).toHaveCount(0);
		await this.industry.click();
		await this.industrySelect.click();
		await expect(this.page.locator('.rcx-options')).toHaveCount(0);
		await this.size.click();
		await this.sizeSelect.click();
		await expect(this.page.locator('.rcx-options')).toHaveCount(0);
		await this.country.click();
		await this.countrySelect.click();
		await this.nextStep.click();
	}

	async stepThreeSuccess(): Promise<void> {
		await this.standaloneServer.click();
	}

	async stepOneFailedBlankFields(): Promise<void> {
		await this.nextStep.click();
		await expect(this.fullNameInvalidText).toBeVisible();
		await expect(this.userNameInvalidText).toBeVisible();
		await expect(this.companyEmailInvalidText).toBeVisible();
		await expect(this.passwordInvalidText).toBeVisible();
	}

	async stepOneFailedWithInvalidEmail(adminCredentials: { name: string; password: string }): Promise<void> {
		await this.fullName.type(adminCredentials.name);
		await this.userName.type(adminCredentials.name);
		await this.companyEmail.type('mail');
		await this.password.type(adminCredentials.password);
		await this.nextStep.click();
		await expect(this.companyEmail).toBeFocused();
	}

	async stepTwoFailedWithBlankFields(): Promise<void> {
		await this.nextStep.click();
		await expect(this.organizationName).toBeVisible();
		await expect(this.industryInvalidSelect).toBeVisible();
		await expect(this.sizeInvalidSelect).toBeVisible();
		await expect(this.countryInvalidSelect).toBeVisible();
	}

	async stepThreeFailedWithInvalidField(): Promise<void> {
		await this.registeredServer.type('mail');
		await this.registeredServer.click({ clickCount: 3 });
		await this.page.keyboard.press('Backspace');
		await expect(this.stepThreeInputInvalidMail).toBeVisible();
	}
}

test.describe('[Wizard]', () => {
	let pageAuth: Auth;
	let pageTestContext: Page;

	let setupWizard: SetupWizard;

	test.beforeEach(async ({ page }) => {
		pageTestContext = page;
		pageAuth = new Auth(page);
		setupWizard = new SetupWizard(page);
	});

	test.describe('[Step 2]', async () => {
		test.beforeEach(async () => {
			await pageAuth.doLogin(ADMIN_CREDENTIALS, false);
		});

		test('expect required field alert showed when user dont inform data', async () => {
			await setupWizard.stepTwoFailedWithBlankFields();
		});

		test('expect go to Step 3 successfully', async () => {
			await setupWizard.stepTwoSuccess();
			await expect(pageTestContext).toHaveURL(/.*\/setup-wizard\/3/);
		});
	});

	test.describe('[Step 3]', async () => {
		test.beforeEach(async () => {
			await pageAuth.doLogin(ADMIN_CREDENTIALS, false);
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
			await pageAuth.doLogin(ADMIN_CREDENTIALS, false);
			await setupWizard.stepTwoSuccess();
			await setupWizard.stepThreeSuccess();
		});

		test('expect confirm the standalone option', async () => {
			await expect(setupWizard.goToWorkspace).toBeVisible();
			await expect(setupWizard.standaloneConfirmText).toBeVisible();
		});

		test('expect confirm standalone', async () => {
			await setupWizard.goToWorkspace.click();
			// HOME_SELECTOR
			await pageTestContext.waitForSelector('//span[@class="rc-header__block"]');
		});
	});
});
