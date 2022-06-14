import { Locator, expect } from '@playwright/test';

import { ILogin, IRegister } from '../utils/interfaces/Login';
import { BasePage } from './BasePage';
import { HOME_SELECTOR, REGISTER_STEP2_BUTTON } from '../utils/mocks/waitSelectorsMock';

export class LoginPage extends BasePage {
	private get registerButton(): Locator {
		return this.page.locator('button.register');
	}

	private get forgotPasswordButton(): Locator {
		return this.page.locator('.forgot-password');
	}

	get submitButton(): Locator {
		return this.page.locator('.login');
	}

	get registerNextButton(): Locator {
		return this.page.locator('button[data-loading-text=" Please_wait ..."]');
	}

	get emailOrUsernameField(): Locator {
		return this.page.locator('[name=emailOrUsername]');
	}

	get nameField(): Locator {
		return this.page.locator('[name=name]');
	}

	get emailField(): Locator {
		return this.page.locator('[name=email]');
	}

	get passwordField(): Locator {
		return this.page.locator('[name=pass]');
	}

	get confirmPasswordField(): Locator {
		return this.page.locator('[name=confirm-pass]');
	}

	get nameInvalidText(): Locator {
		return this.page.locator('[name=name]~.input-error');
	}

	get emailInvalidText(): Locator {
		return this.page.locator('[name=email]~.input-error');
	}

	get passwordInvalidText(): Locator {
		return this.page.locator('[name=pass]~.input-error');
	}

	get confirmPasswordInvalidText(): Locator {
		return this.page.locator('[name=confirm-pass]~.input-error');
	}

	get getSideBarAvatarButton(): Locator {
		return this.page.locator('[data-qa="sidebar-avatar-button"]');
	}

	public async gotToRegister(): Promise<void> {
		await this.registerButton.click();
	}

	public async gotToForgotPassword(): Promise<void> {
		await this.forgotPasswordButton.click();
	}

	public async registerNewUser({ name, email, password }: IRegister): Promise<void> {
		await this.nameField.type(name);
		await this.emailField.type(email);
		await this.passwordField.type(password);
		await this.confirmPasswordField.type(password);
		await this.submit();

		await this.waitForSelector(REGISTER_STEP2_BUTTON);
		await this.registerNextButton.click();
		await this.waitForSelector(HOME_SELECTOR);
	}

	public async login({ email, password }: ILogin): Promise<void> {
		await this.emailOrUsernameField.type(email);
		await this.passwordField.type(password);
		await this.submitButton.click();
	}

	public async submit(): Promise<void> {
		await this.submitButton.click();
	}

	public async registerFail(): Promise<void> {
		await this.gotToRegister();
		await this.submit();

		await expect(this.nameInvalidText).toBeVisible();
		await expect(this.emailInvalidText).toBeVisible();
		await expect(this.passwordInvalidText).toBeVisible();
	}

	public async registerFailWithDifferentPassword({ name, email, password }: IRegister, invalidPassword: string): Promise<void> {
		await this.gotToRegister();
		await this.passwordField.type(password);
		await this.emailField.type(email);
		await this.nameField.type(name);
		await this.confirmPasswordField.type(invalidPassword);

		await this.submit();
		await expect(this.confirmPasswordInvalidText).toBeVisible();
		await expect(this.confirmPasswordInvalidText).toHaveText('The password confirmation does not match password');
	}

	public async logout(): Promise<void> {
		await this.getSideBarAvatarButton.click();
		await this.page.locator('li.rcx-option >> text="Logout"').click();
	}
}
