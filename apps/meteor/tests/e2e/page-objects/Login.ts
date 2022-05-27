import { Locator } from '@playwright/test';

import { ILogin, IRegister } from '../utils/interfaces/Login';
import { BasePage } from './BasePage';

export class Login extends BasePage {
	get btnRegister(): Locator {
		return this.page.locator('button.register');
	}

	get btnRegisterNext(): Locator {
		return this.page.locator('button[data-loading-text=" Please_wait ..."]');
	}

	get btnPasswordForgot(): Locator {
		return this.page.locator('.forgot-password');
	}

	get btnFormSubmit(): Locator {
		return this.page.locator('.login');
	}

	get inputEmailOrUsername(): Locator {
		return this.page.locator('[name=emailOrUsername]');
	}

	get inputUsername(): Locator {
		return this.page.locator('[name=username]');
	}

	get inputName(): Locator {
		return this.page.locator('[name=name]');
	}

	get inputEmail(): Locator {
		return this.page.locator('[name=email]');
	}

	get inputPassword(): Locator {
		return this.page.locator('[name=pass]');
	}

	get inputPasswordConfirm(): Locator {
		return this.page.locator('[name=confirm-pass]');
	}

	get textErrorEmailOrUsername(): Locator {
		return this.page.locator('[name=emailOrUsername]~.input-error');
	}

	get textErrorName(): Locator {
		return this.page.locator('[name=name]~.input-error');
	}

	get textErrorEmail(): Locator {
		return this.page.locator('[name=email]~.input-error');
	}

	get textErrorPassword(): Locator {
		return this.page.locator('[name=pass]~.input-error');
	}

	get textErrorPasswordConfirm(): Locator {
		return this.page.locator('[name=confirm-pass]~.input-error');
	}

	async doLogin(input: ILogin): Promise<void> {
		await this.inputEmailOrUsername.type(input.email);
		await this.inputPassword.type(input.password);
		await this.btnFormSubmit.click();
	}

	async doRegister(input: IRegister, shouldHandleNextScreen = true): Promise<void> {
		await this.inputName.type(input.name);
		await this.inputEmail.type(input.email);
		await this.inputPassword.type(input.password);
		await this.inputPasswordConfirm.type(input.passwordConfirm ?? input.password);
		await this.btnFormSubmit.click();

		if (shouldHandleNextScreen) {
			await this.page.waitForSelector('//button[contains(text(), "Use this username")]');
			await this.btnRegisterNext.click();
			await this.page.waitForSelector('//span[@class="rc-header__block"]');
		}
	}

	async doLogout(): Promise<void> {
		await this.page.locator('[data-qa="sidebar-avatar-button"]').click();
		await this.page.locator('li.rcx-option >> text="Logout"').click();
	}
}
