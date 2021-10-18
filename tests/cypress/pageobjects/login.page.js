import Page from './Page';

class LoginPage extends Page {
	get registerButton() { return browser.element('button.register'); }

	get forgotPasswordButton() { return browser.element('.forgot-password'); }

	get backToLoginButton() { return browser.element('.back-to-login'); }

	get submitButton() { return browser.element('.login'); }

	get emailOrUsernameField() { return browser.element('[name=emailOrUsername]'); }

	get nameField() { return browser.element('[name=name]'); }

	get emailField() { return browser.element('[name=email]'); }

	get passwordField() { return browser.element('[name=pass]'); }

	get confirmPasswordField() { return browser.element('[name=confirm-pass]'); }

	get reasonField() { return browser.element('[name=reason]'); }

	get inputUsername() { return browser.element('form#login-card input#username'); }

	get emailOrUsernameInvalidText() { return browser.element('[name=emailOrUsername]~.input-error'); }

	get nameInvalidText() { return browser.element('[name=name]~.input-error'); }

	get emailInvalidText() { return browser.element('[name=email]~.input-error'); }

	get passwordInvalidText() { return browser.element('[name=pass]~.input-error'); }

	get confirmPasswordInvalidText() { return browser.element('[name=confirm-pass]~.input-error'); }

	get registrationSucceededCard() { return browser.element('#login-card h2'); }

	open() {
		super.open('');
	}

	gotToRegister() {
		this.registerButton.click();
	}

	gotToForgotPassword() {
		this.forgotPasswordButton.click();
	}

	registerNewUser({ username, email, password }) {
		this.nameField.type(username);
		this.emailField.type(email);
		this.passwordField.type(password);
		this.confirmPasswordField.type(password);

		this.submit();
	}

	registerNewAdmin({ adminUsername, adminEmail, adminPassword }) {
		this.nameField.type(adminUsername);
		this.emailField.type(adminEmail);
		this.passwordField.type(adminPassword);
		this.confirmPasswordField.type(adminPassword);

		this.submit();
	}

	login({ email, password }) {
		this.emailOrUsernameField.type(email);
		this.passwordField.type(password);

		this.submit();
	}

	loginSucceded({ email, password }) {
		this.login({ email, password });
	}

	submit() {
		this.submitButton.click();
	}
}

module.exports = new LoginPage();
