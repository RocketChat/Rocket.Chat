import { expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';
import { reason, INVALID_EMAIL_WITHOUT_MAIL_PROVIDER } from '../utils/mocks/userAndPasswordMock';
import { IRegister } from '../utils/interfaces/Login';
import { BACKSPACE } from '../utils/mocks/keyboardKeyMock';

export class SetupWizard extends BasePage {
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
		return this.page.locator('//button[contains(text(), "Continue as standalone")]');
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

	public async stepTwoSuccess(): Promise<void> {
		await this.organizationName.type(reason);
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

	public async stepThreeSuccess(): Promise<void> {
		await this.standaloneServer.click();
	}

	public async stepOneFailedBlankFields(): Promise<void> {
		await this.nextStep.click();
		await expect(this.fullNameInvalidText).toBeVisible();
		await expect(this.userNameInvalidText).toBeVisible();
		await expect(this.companyEmailInvalidText).toBeVisible();
		await expect(this.passwordInvalidText).toBeVisible();
	}

	public async stepOneFailedWithInvalidEmail(adminCredentials: IRegister): Promise<void> {
		await this.fullName.type(adminCredentials.name);
		await this.userName.type(adminCredentials.name);
		await this.companyEmail.type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await this.password.type(adminCredentials.password);
		await this.nextStep.click();
		await expect(this.companyEmail).toBeFocused();
	}

	public async stepTwoFailedWithBlankFields(): Promise<void> {
		await this.nextStep.click();
		await expect(this.organizationName).toBeVisible();
		await expect(this.industryInvalidSelect).toBeVisible();
		await expect(this.sizeInvalidSelect).toBeVisible();
		await expect(this.countryInvalidSelect).toBeVisible();
	}

	public async stepThreeFailedWithInvalidField(): Promise<void> {
		await this.registeredServer.type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await this.registeredServer.click({ clickCount: 3 });
		await this.keyboardPress(BACKSPACE);
		await expect(this.stepThreeInputInvalidMail).toBeVisible();
	}
}
