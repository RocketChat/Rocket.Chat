import Page from './Page';
import mainContent from './main-content.page';

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
	get inputUsername() { return browser.element('form#login-card input#username'); }

	get emailOrUsernameInvalidText() { return browser.element('[name=emailOrUsername]~.input-error'); }
	get nameInvalidText() { return browser.element('[name=name]~.input-error'); }
	get emailInvalidText() { return browser.element('[name=email]~.input-error'); }
	get passwordInvalidText() { return browser.element('[name=pass]~.input-error'); }
	get confirmPasswordInvalidText() { return browser.element('[name=confirm-pass]~.input-error'); }
	get registrationSucceededCard() { return browser.element('#login-card h2'); }

	get GlobalAnnouncement() { return browser.element('body > section > div > div.global-announcement'); }

	open() {
		super.open('');
	}

	gotToRegister() {
		this.registerButton.waitForVisible(5000);
		this.registerButton.click();
		// This Can Cause Timeouts erros if the server is slow so it should have a big wait
		this.nameField.waitForVisible(15000);
	}

	gotToForgotPassword() {
		this.forgotPasswordButton.waitForVisible(5000);
		this.forgotPasswordButton.click();
		// This Can Cause Timeouts erros if the server is slow so it should have a big wait
		this.emailField.waitForVisible(15000);
	}

	registerNewUser({username, email, password}) {
		this.nameField.waitForVisible(5000);
		this.nameField.setValue(username);
		this.emailField.setValue(email);
		this.passwordField.setValue(password);
		this.confirmPasswordField.setValue(password);

		this.submit();
	}

	registerNewAdmin({adminUsername, adminEmail, adminPassword}) {
		this.nameField.waitForVisible(5000);
		this.nameField.setValue(adminUsername);
		this.emailField.setValue(adminEmail);
		this.passwordField.setValue(adminPassword);
		this.confirmPasswordField.setValue(adminPassword);

		this.submit();
	}

	login({email, password}) {
		this.emailOrUsernameField.waitForVisible(5000);
		this.emailOrUsernameField.setValue(email);
		this.passwordField.setValue(password);

		this.submit();
	}

	loginSucceded({email, password}) {
		this.login({email, password});

		mainContent.mainContent.waitForVisible(5000);
	}

	submit() {
		this.submitButton.waitForVisible(5000);
		this.submitButton.click();
	}
}

module.exports = new LoginPage();
