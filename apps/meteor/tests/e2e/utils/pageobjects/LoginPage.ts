import { Locator, expect } from '@playwright/test';

import { ILogin, IRegister } from '../interfaces/Login';
import BasePage from './BasePage';
import { HOME_SELECTOR, REGISTER_STEP2_BUTTON } from '../mocks/waitSelectorsMock';

class LoginPage extends BasePage {
	private registerButton(): Locator {
		return this.getPage().locator('button.register');
	}

	private forgotPasswordButton(): Locator {
		return this.getPage().locator('.forgot-password');
	}

	public submitButton(): Locator {
		return this.getPage().locator('.login');
	}

	public registerNextButton(): Locator {
		return this.getPage().locator('button[data-loading-text=" Please_wait ..."]');
	}

	public registerMessage(): Locator {
		return this.getPage().locator('//form[@id["login-card"]]//header//p');
	}

	public emailOrUsernameField(): Locator {
		return this.getPage().locator('[name=emailOrUsername]');
	}

	public nameField(): Locator {
		return this.getPage().locator('[name=name]');
	}

	public emailField(): Locator {
		return this.getPage().locator('[name=email]');
	}

	public passwordField(): Locator {
		return this.getPage().locator('[name=pass]');
	}

	public userNameField(): Locator {
		return this.getPage().locator('[name=username]');
	}

	public confirmPasswordField(): Locator {
		return this.getPage().locator('[name=confirm-pass]');
	}

	public getToastError(): Locator {
		return this.getPage().locator('.toast');
	}

	public getToastMessageSuccess(): Locator {
		return this.getPage().locator('.toast-message');
	}

	public emailOrUsernameInvalidText(): Locator {
		return this.getPage().locator('[name=emailOrUsername]~.input-error');
	}

	public nameInvalidText(): Locator {
		return this.getPage().locator('[name=name]~.input-error');
	}

	public emailInvalidText(): Locator {
		return this.getPage().locator('[name=email]~.input-error');
	}

	public passwordInvalidText(): Locator {
		return this.getPage().locator('[name=pass]~.input-error');
	}

	public confirmPasswordInvalidText(): Locator {
		return this.getPage().locator('[name=confirm-pass]~.input-error');
	}

	public getHomeMessage(): Locator {
		return this.getPage().locator('//span[@class="rc-header__block"]');
	}

	public getSideBarAvatarButton(): Locator {
		return this.getPage().locator('[data-qa="sidebar-avatar-button"]');
	}

	public async open(path: string): Promise<void> {
		await super.goto(path);
	}

	public async gotToRegister(): Promise<void> {
		await this.registerButton().click();
	}

	public async gotToForgotPassword(): Promise<void> {
		await this.forgotPasswordButton().click();
	}

	public async registerNewUser({ name, email, password }: IRegister): Promise<void> {
		await this.nameField().type(name);
		await this.emailField().type(email);
		await this.passwordField().type(password);
		await this.confirmPasswordField().type(password);
		await this.submit();

		await this.waitForSelector(REGISTER_STEP2_BUTTON);
		await this.registerNextButton().click();
		await this.waitForSelector(HOME_SELECTOR);
	}

	public async login({ email, password }: ILogin): Promise<void> {
		await this.emailOrUsernameField().type(email);
		await this.passwordField().type(password);
		await this.submitButton().click();
	}

	public async submit(): Promise<void> {
		await this.submitButton().click();
	}

	public async registerFail(): Promise<void> {
		await this.gotToRegister();
		await this.submit();

		await expect(this.nameInvalidText()).toBeVisible();
		await expect(this.emailInvalidText()).toBeVisible();
		await expect(this.passwordInvalidText()).toBeVisible();
	}

	public async registerFailWithDifferentPassword({ name, email, password }: IRegister, invalidPassword: string): Promise<void> {
		await this.gotToRegister();
		await this.passwordField().type(password);
		await this.emailField().type(email);
		await this.nameField().type(name);
		await this.confirmPasswordField().type(invalidPassword);

		await this.submit();
		await expect(this.confirmPasswordInvalidText()).toBeVisible();
		await expect(this.confirmPasswordInvalidText()).toHaveText('The password confirmation does not match password');
	}

	public async logout(): Promise<void> {
		await this.getSideBarAvatarButton().click();
		await this.getPage().locator('li.rcx-option >> text="Logout"').click();
	}
}

export default LoginPage;
