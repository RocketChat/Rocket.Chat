import type { FrameLocator, Locator, Page } from '@playwright/test';

import { expect } from '../utils/test';

abstract class Main {
	constructor(protected root: Locator) {}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}
}

export class Authenticated extends Main {
	constructor(protected page: Page) {
		super(page.locator('#main-content'));
	}
}

class LoginForm {
	readonly root: Locator;

	constructor(protected page: Page) {
		this.root = page?.getByRole('form', { name: 'Login' });
	}

	get username(): Locator {
		return this.root.locator('role=textbox[name=/username/i]');
	}

	get inputPassword(): Locator {
		return this.root.getByRole('textbox', { name: 'Password', exact: true });
	}

	get btnLogin(): Locator {
		return this.root.getByRole('button', { name: 'Login', exact: true });
	}

	async fillForm(username: string, password: string) {
		await this.username.fill(username);
		await this.inputPassword.fill(password);
	}
}

export class Login extends Main {
	readonly form: LoginForm;

	constructor(protected page: Page) {
		super(page.getByRole('main', { name: 'Login', exact: true }));
		this.form = new LoginForm(page);
	}

	async login(username: string, password: string) {
		await this.form.fillForm(username, password);
		await this.form.btnLogin.click();
	}

	get loginIframe(): FrameLocator {
		return this.page.frameLocator('iframe[title="Login"]');
	}

	get loginIframeForm(): Locator {
		return this.loginIframe.locator('#login-form');
	}

	get loginIframeSubmitButton(): Locator {
		return this.loginIframe.locator('#submit');
	}

	get loginIframeError(): Locator {
		return this.loginIframe.locator('#login-error', { hasText: 'Login failed' });
	}
}

export class Registration extends Main {
	constructor(protected page: Page) {
		super(page.getByRole('main'));
	}

	get btnSendInstructions(): Locator {
		return this.page.locator('role=button[name="Send instructions"]');
	}

	get btnReset(): Locator {
		return this.page.locator('role=button[name="Reset"]');
	}

	get btnLoginWithSaml(): Locator {
		return this.page.locator('role=button[name="SAML test login button"]');
	}

	get btnLoginWithGoogle(): Locator {
		return this.page.locator('role=button[name="Sign in with Google"]');
	}

	get btnLoginWithCustomOAuth(): Locator {
		return this.page.locator('role=button[name="Sign in with Test"]');
	}

	get goToRegister(): Locator {
		return this.page.locator('role=link[name="Create an account"]');
	}

	get btnRegister(): Locator {
		return this.page.locator('role=button[name="Join your team"]');
	}

	get btnRegisterConfirmUsername(): Locator {
		return this.page.locator('role=button[name="Use this username"]');
	}

	get btnForgotPassword(): Locator {
		return this.page.locator('role=link[name="Forgot your password?"]');
	}

	get username(): Locator {
		return this.page.locator('role=textbox[name=/username/i]');
	}

	get inputName(): Locator {
		return this.page.locator('[name=name]');
	}

	get inputEmail(): Locator {
		return this.page.locator('role=textbox[name=/Email/]');
	}

	get inputPassword(): Locator {
		return this.page.locator('[name=password]');
	}

	get inputReason(): Locator {
		return this.page.locator('role=textbox[name=/Reason/]');
	}

	get inputPasswordConfirm(): Locator {
		return this.page.locator('[name=passwordConfirmation]');
	}

	get forgotPasswordEmailCallout(): Locator {
		return this.page.locator('role=status');
	}

	get registrationDisabledCallout(): Locator {
		return this.page.locator('role=status >> text=/New user registration is currently disabled/');
	}
}
