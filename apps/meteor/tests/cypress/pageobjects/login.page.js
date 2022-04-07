import Page from './Page';

class LoginPage extends Page {
	get registerButton() {
		return cy.get('button.register');
	}

	get forgotPasswordButton() {
		return cy.get('.forgot-password');
	}

	get backToLoginButton() {
		return cy.get('.back-to-login');
	}

	get submitButton() {
		return cy.get('.login');
	}

	get emailOrUsernameField() {
		return cy.get('[name=emailOrUsername]');
	}

	get nameField() {
		return cy.get('[name=name]');
	}

	get usernameField() {
		return cy.get('[name=username]');
	}

	get emailField() {
		return cy.get('[name=email]');
	}

	get passwordField() {
		return cy.get('[name=pass]');
	}

	get confirmPasswordField() {
		return cy.get('[name=confirm-pass]');
	}

	get reasonField() {
		return cy.get('[name=reason]');
	}

	get inputUsername() {
		return cy.get('form#login-card input#username');
	}

	get emailOrUsernameInvalidText() {
		return cy.get('[name=emailOrUsername]~.input-error');
	}

	get nameInvalidText() {
		return cy.get('[name=name]~.input-error');
	}

	get emailInvalidText() {
		return cy.get('[name=email]~.input-error');
	}

	get passwordInvalidText() {
		return cy.get('[name=pass]~.input-error');
	}

	get confirmPasswordInvalidText() {
		return cy.get('[name=confirm-pass]~.input-error');
	}

	get registrationSucceededCard() {
		return cy.get('#login-card h2');
	}

	open() {
		localStorage.clear();
		super.open('');
		cy.wait(1000);
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

export default new LoginPage();
