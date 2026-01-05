import type { FrameLocator, Locator, Page } from '@playwright/test';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { expect } from '../utils/test';

abstract class Main {
	protected root: Locator;

	protected t: (key: TranslationKey) => string;

	constructor(root: Locator, t: (key: TranslationKey) => string = (key) => key) {
		this.root = root;
		this.t = t;
	}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}
}

export class Authenticated extends Main {
	protected page: Page;

	constructor(page: Page, t: (key: TranslationKey) => string = (key) => key) {
		super(page.locator('#main-content'), t);
		this.page = page;
	}
}

export class Registration extends Main {
	protected page: Page;

	constructor(page: Page, t: (key: TranslationKey) => string = (key) => key) {
		super(page.getByRole('main'), t);
		this.page = page;
	}

	get btnSendInstructions(): Locator {
		return this.page.locator('role=button[name="Send instructions"]');
	}

	get btnReset(): Locator {
		return this.page.locator('role=button[name="Reset"]');
	}

	get btnLogin(): Locator {
		return this.page.locator('role=button[name="Login"]');
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
		return this.page.getByRole('button', { name: this.t('registration.component.form.joinYourTeam') });
	}

	get btnRegisterConfirmUsername(): Locator {
		return this.page.locator('role=button[name="Use this username"]');
	}

	get btnForgotPassword(): Locator {
		return this.page.locator('role=link[name="Forgot your password?"]');
	}

	get username(): Locator {
		return this.page.getByRole('textbox', { name: this.t('Username') });
	}

	get inputName(): Locator {
		return this.page.getByRole('textbox', { name: this.t('Name'), exact: true });
	}

	get inputEmail(): Locator {
		return this.page.getByRole('textbox', { name: this.t('Email') });
	}

	get inputPassword(): Locator {
		return this.page.getByRole('textbox', { name: this.t('Password'), exact: true });
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
