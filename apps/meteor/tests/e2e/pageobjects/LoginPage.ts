import { Locator } from '@playwright/test';

import { ILogin, IRegister } from '../utils/interfaces/Login';
import { BasePage } from './BasePage';
import { HOME_SELECTOR, REGISTER_STEP2_BUTTON } from '../utils/mocks/waitSelectorsMock';

export class LoginPage extends BasePage {
	get btnRegister(): Locator {
		return this.page.locator('button.register');
	}

	get btnForgotPassword(): Locator {
		return this.page.locator('.forgot-password');
	}

	get btnSubmit(): Locator {
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

	async registerNewUser({ name, email, password }: IRegister): Promise<void> {
		await this.nameField.type(name);
		await this.emailField.type(email);
		await this.passwordField.type(password);
		await this.confirmPasswordField.type(password);
		await this.btnSubmit.click();

		await this.page.waitForSelector(REGISTER_STEP2_BUTTON);
		await this.registerNextButton.click();
		await this.page.waitForSelector(HOME_SELECTOR);
	}

	async doLogin({ email, password }: ILogin, shouldWaitForHomeScreen = true): Promise<void> {
		await this.emailOrUsernameField.type(email);
		await this.passwordField.type(password);
		await this.btnSubmit.click();

		if (shouldWaitForHomeScreen) {
			await this.page.waitForSelector('.main-content');
		}
	}
}
