import { expect, Locator } from '@playwright/test';

import BasePage from './BasePage';
import { reason, INVALID_EMAIL_WITHOUT_MAIL_PROVIDER } from '../mocks/userAndPasswordMock';
import { IRegister } from '../interfaces/Login';
import { BACKSPACE } from '../mocks/keyboardKeyMock';

class SetupWizard extends BasePage {
	private nextStep(): Locator {
		return this.getPage().locator('//button[contains(text(), "Next")]');
	}

	private fullName(): Locator {
		return this.getPage().locator('[name="fullname"]');
	}

	private userName(): Locator {
		return this.getPage().locator('[name="username"]');
	}

	private companyEmail(): Locator {
		return this.getPage().locator('[name="companyEmail"]');
	}

	private password(): Locator {
		return this.getPage().locator('[name="password"]');
	}

	public goToWorkspace(): Locator {
		return this.getPage().locator('//button[contains(text(), "Confirm")]');
	}

	private organizationType(): Locator {
		return this.getPage().locator('[name="organizationType"]');
	}

	private organizationTypeSelect(): Locator {
		return this.getPage().locator('.rcx-options .rcx-option:first-child');
	}

	private organizationName(): Locator {
		return this.getPage().locator('[name="organizationName"]');
	}

	private industry(): Locator {
		return this.getPage().locator('[name="organizationIndustry"]');
	}

	private industrySelect(): Locator {
		return this.getPage().locator('.rcx-options .rcx-option:first-child');
	}

	private size(): Locator {
		return this.getPage().locator('[name="organizationSize"]');
	}

	private sizeSelect(): Locator {
		return this.getPage().locator('.rcx-options .rcx-option:first-child');
	}

	private country(): Locator {
		return this.getPage().locator('[name="country"]');
	}

	private countrySelect(): Locator {
		return this.getPage().locator('.rcx-options .rcx-option:first-child');
	}

	public registeredServer(): Locator {
		return this.getPage().locator('input[name=email]');
	}

	public registerButton(): Locator {
		return this.getPage().locator('//button[contains(text(), "Register")]');
	}

	public agreementField(): Locator {
		return this.getPage().locator('//input[@name="agreement"]/../i[contains(@class, "rcx-check-box")]');
	}

	public standaloneServer(): Locator {
		return this.getPage().locator('//button[contains(text(), "Continue as standalone")]');
	}

	public standaloneConfirmText(): Locator {
		return this.getPage().locator('//*[contains(text(), "Standalone Server Confirmation")]');
	}

	private fullNameInvalidText(): Locator {
		return this.getPage().locator('//input[@name="fullname"]/../following-sibling::span');
	}

	private userNameInvalidText(): Locator {
		return this.getPage().locator('//input[@name="username"]/../following-sibling::span');
	}

	private companyEmailInvalidText(): Locator {
		return this.getPage().locator('//input[@name="companyEmail"]/../following-sibling::span');
	}

	private passwordInvalidText(): Locator {
		return this.getPage().locator('//input[@name="password"]/../../../span[contains(@class, "rcx-field__error")]');
	}

	private industryInvalidSelect(): Locator {
		return this.getPage().locator('//div[@name="organizationIndustry"]/../following-sibling::span');
	}

	private sizeInvalidSelect(): Locator {
		return this.getPage().locator('//div[@name="organizationSize"]/../following-sibling::span');
	}

	private countryInvalidSelect(): Locator {
		return this.getPage().locator('//div[@name="country"]/../following-sibling::span');
	}

	public async goNext(): Promise<void> {
		await this.nextStep().click();
	}

	private stepThreeInputInvalidMail(): Locator {
		return this.getPage().locator('//input[@name="email"]/../../span[contains(text(), "This field is required")]');
	}

	public async stepTwoSuccess(): Promise<void> {
		await this.organizationName().type(reason);

		await this.organizationType().click();
		await this.organizationTypeSelect().click();
		await expect(this.getPage().locator('.rcx-options')).toHaveCount(0);

		await this.industry().click();
		await this.industrySelect().click();
		await expect(this.getPage().locator('.rcx-options')).toHaveCount(0);

		await this.size().click();
		await this.sizeSelect().click();
		await expect(this.getPage().locator('.rcx-options')).toHaveCount(0);

		await this.country().click();
		await this.countrySelect().click();

		await this.goNext();
	}

	public async stepThreeSuccess(): Promise<void> {
		await this.standaloneServer().click();
	}

	public async stepOneFailedBlankFields(): Promise<void> {
		await this.goNext();

		await expect(this.fullNameInvalidText()).toBeVisible();
		await expect(this.userNameInvalidText()).toBeVisible();
		await expect(this.companyEmailInvalidText()).toBeVisible();
		await expect(this.passwordInvalidText()).toBeVisible();
	}

	public async stepOneFailedWithInvalidEmail(adminCredentials: IRegister): Promise<void> {
		await this.fullName().type(adminCredentials.name);
		await this.userName().type(adminCredentials.name);
		await this.companyEmail().type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await this.password().type(adminCredentials.password);

		await this.goNext();

		await expect(this.companyEmail()).toBeFocused();
	}

	public async stepTwoFailedWithBlankFields(): Promise<void> {
		await this.goNext();

		await expect(this.organizationName()).toBeVisible();
		await expect(this.industryInvalidSelect()).toBeVisible();
		await expect(this.sizeInvalidSelect()).toBeVisible();
		await expect(this.countryInvalidSelect()).toBeVisible();
	}

	public async stepThreeFailedWithInvalidField(): Promise<void> {
		await this.registeredServer().type(INVALID_EMAIL_WITHOUT_MAIL_PROVIDER);
		await this.registeredServer().click({ clickCount: 3 });
		await this.keyboardPress(BACKSPACE);

		await expect(this.stepThreeInputInvalidMail()).toBeVisible();
	}

	async goToHome(): Promise<void> {
		await this.goToWorkspace().click();
	}
}

export default SetupWizard;
