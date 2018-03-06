/* eslint-env mocha */

import loginPage from '../../pageobjects/login.page';

describe('[Forgot Password]', () => {
	before(() => {
		loginPage.open();
		loginPage.gotToForgotPassword();
	});

	describe('render:', () => {
		it('it should not show name field', () => {
			loginPage.nameField.isVisible().should.be.false;
		});

		it('it should show email field', () => {
			loginPage.emailField.isVisible().should.be.true;
		});

		it('it should not show password field', () => {
			loginPage.passwordField.isVisible().should.be.false;
		});

		it('it should not show confirm password field', () => {
			loginPage.confirmPasswordField.isVisible().should.be.false;
		});

		it('it should not show email / username field', () => {
			loginPage.emailOrUsernameField.isVisible().should.be.false;
		});

		it('it should show submit button', () => {
			loginPage.submitButton.isVisible().should.be.true;
		});

		it('it should not show register button', () => {
			loginPage.registerButton.isVisible().should.be.false;
		});

		it('it should not show forgot password button', () => {
			loginPage.forgotPasswordButton.isVisible().should.be.false;
		});

		it('it should show back to login button', () => {
			loginPage.backToLoginButton.isVisible().should.be.true;
		});
	});

	describe('email:', () => {
		it('it should be required', () => {
			loginPage.submit();
			loginPage.emailField.getAttribute('class').should.contain('error');
			loginPage.emailInvalidText.getText().should.not.be.empty;
		});

		it('it should be invalid for email without domain', () => {
			loginPage.emailField.setValue('invalid-email');
			loginPage.submit();
			loginPage.emailField.getAttribute('class').should.contain('error');
			loginPage.emailInvalidText.getText().should.not.be.empty;
		});

		it('it should be invalid for email with invalid domain', () => {
			loginPage.emailField.setValue('invalid-email@mail');
			loginPage.submit();
			loginPage.emailField.getAttribute('class').should.contain('error');
			loginPage.emailInvalidText.getText().should.not.be.empty;
		});

		it('it should be invalid for email space', () => {
			loginPage.emailField.setValue('invalid email@mail.com');
			loginPage.submit();
			loginPage.emailField.getAttribute('class').should.contain('error');
			loginPage.emailInvalidText.getText().should.not.be.empty;
		});
	});
});
