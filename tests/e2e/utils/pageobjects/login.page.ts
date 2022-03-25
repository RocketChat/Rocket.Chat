import { Locator } from '@playwright/test';

import { ILogin, IRegister } from '../interfaces/Login';
import Pages from './Pages';

class LoginPage extends Pages {
	private registerButton(): Locator {
		return this.page.locator('button.register');
	}

	private forgotPasswordButton(): Locator {
		return this.page.locator('.forgot-password');
	}

	public submitButton(): Locator {
		return this.page.locator('.login');
	}

	public registerNextButton(): Locator {
		return this.page.locator('button[data-loading-text=" Please_wait ..."]');
	}

	public registerMessage(): Locator {
		return this.page.locator('//form[@id["login-card"]]//header//p');
	}

	public emailOrUsernameField(): Locator {
		return this.page.locator('[name=emailOrUsername]');
	}

	public nameField(): Locator {
		return this.page.locator('[name=name]');
	}

	public emailField(): Locator {
		return this.page.locator('[name=email]');
	}

	public passwordField(): Locator {
		return this.page.locator('[name=pass]');
	}

	public userNameField(): Locator {
		return this.page.locator('[name=username]');
	}

	public confirmPasswordField(): Locator {
		return this.page.locator('[name=confirm-pass]');
	}

	public getToastError(): Locator {
		return this.page.locator('.toast');
	}

	public getToastMessageSuccess(): Locator {
		return this.page.locator('.toast-message');
	}

	public emailOrUsernameInvalidText(): Locator {
		return this.page.locator('[name=emailOrUsername]~.input-error');
	}

	public nameInvalidText(): Locator {
		return this.page.locator('[name=name]~.input-error');
	}

	public emailInvalidText(): Locator {
		return this.page.locator('[name=email]~.input-error');
	}

	public passwordInvalidText(): Locator {
		return this.page.locator('[name=pass]~.input-error');
	}

	public confirmPasswordInvalidText(): Locator {
		return this.page.locator('[name=confirm-pass]~.input-error');
	}

	public getHomeMessage(): Locator {
		return this.page.locator('//span[@class="rc-header__block"]');
	}

	public async open(): Promise<void> {
		await super.open('');
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
	}

	public async login({ email, password }: ILogin): Promise<void> {
		await this.emailOrUsernameField().type(email);
		await this.passwordField().type(password);
		await this.submitButton().click();
	}

	public async submit(): Promise<void> {
		await this.submitButton().click();
	}
}

export default LoginPage;
