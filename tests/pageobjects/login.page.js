import Page from './Page';

class LoginPage extends Page {
	get registerButton() { return browser.element('button.register'); }
	get forgotPasswordButton() { return browser.element('button.forgot-password'); }
	get backToLoginButton() { return browser.element('button.back-to-login'); }
	get submitButton() { return browser.element('.submit > button'); }

	get emailOrUsernameField() { return browser.element('[name=emailOrUsername]'); }
	get nameField() { return browser.element('[name=name]'); }
	get emailField() { return browser.element('[name=email]'); }
	get passwordField() { return browser.element('[name=pass]'); }
	get confirmPasswordField() { return browser.element('[name=confirm-pass]'); }

	get emailOrUsernameInvalidText() { return browser.element('[name=emailOrUsername]~.input-error'); }
	get nameInvalidText() { return browser.element('[name=name]~.input-error'); }
	get emailInvalidText() { return browser.element('[name=email]~.input-error'); }
	get passwordInvalidText() { return browser.element('[name=pass]~.input-error'); }
	get confirmPasswordInvalidText() { return browser.element('[name=confirm-pass]~.input-error'); }

	open() {
		super.open('');
	}

	gotToRegister() {
		this.registerButton.click();
	}

	gotToForgotPassword() {
		this.forgotPasswordButton.click();
	}

	registerNewUser({username, email, password}) {
		this.nameField.setValue(username);
		this.emailField.setValue(email);
		this.passwordField.setValue(password);
		this.confirmPasswordField.setValue(password);

		this.submit();
	}

	login({email, password}) {
		this.emailOrUsernameField.setValue(email);
		this.passwordField.setValue(password);

		this.submit();
	}

	submit() {
		this.submitButton.click();
	}
}

module.exports = new LoginPage();
