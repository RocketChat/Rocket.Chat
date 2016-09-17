/* eslint-env mocha */

import loginPage from '../pageobjects/login.page';

describe('login', () => {
	it('load page', () => {
		loginPage.open();
	});

	describe('render', () => {
		it('should show email / username field', () => {
			loginPage.emailOrUsernameField.isVisible().should.be.true;
		});

		it('should show password field', () => {
			loginPage.passwordField.isVisible().should.be.true;
		});

		it('should show submit button', () => {
			loginPage.submitButton.isVisible().should.be.true;
		});

		it('should show register button', () => {
			loginPage.registerButton.isVisible().should.be.true;
		});

		it('should show forgot password button', () => {
			loginPage.forgotPasswordButton.isVisible().should.be.true;
		});

		it('should not show name field', () => {
			loginPage.nameField.isVisible().should.be.false;
		});

		it('should not show email field', () => {
			loginPage.emailField.isVisible().should.be.false;
		});

		it('should not show confirm password field', () => {
			loginPage.confirmPasswordField.isVisible().should.be.false;
		});

		it('should not show back to login button', () => {
			loginPage.backToLoginButton.isVisible().should.be.false;
		});
	});

	describe('email / username', () => {
		it('it should be required', () => {
			loginPage.submit();
			loginPage.emailOrUsernameField.getAttribute('class').should.contain('error');
			loginPage.emailOrUsernameInvalidText.getText().should.not.be.empty;
		});
	});

	describe('password', () => {
		it('it should be required', () => {
			loginPage.submit();
			loginPage.passwordField.getAttribute('class').should.contain('error');
			loginPage.passwordInvalidText.getText().should.not.be.empty;
		});
	});
});
