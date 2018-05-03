/* eslint-env mocha */

import loginPage from '../../pageobjects/login.page';

describe('[Login]', () => {
	before(()=>{
		loginPage.open();
		// This Can Cause Timeouts erros if the server is slow so it should have a big wait
		loginPage.emailOrUsernameField.waitForVisible(15000);
	});

	describe('[Render]', () => {
		it('it should show email / username field', () => {
			loginPage.emailOrUsernameField.isVisible().should.be.true;
		});

		it('it should show password field', () => {
			loginPage.passwordField.isVisible().should.be.true;
		});

		it('it should show submit button', () => {
			loginPage.submitButton.isVisible().should.be.true;
		});

		it('it should show register button', () => {
			loginPage.registerButton.isVisible().should.be.true;
		});

		it('it should show forgot password button', () => {
			loginPage.forgotPasswordButton.isVisible().should.be.true;
		});

		it('it should not show name field', () => {
			loginPage.nameField.isVisible().should.be.false;
		});

		it('it should not show email field', () => {
			loginPage.emailField.isVisible().should.be.false;
		});

		it('it should not show confirm password field', () => {
			loginPage.confirmPasswordField.isVisible().should.be.false;
		});

		it('it should not show back to login button', () => {
			loginPage.backToLoginButton.isVisible().should.be.false;
		});
	});

	describe('[Required Fields]', () => {
		before(() => {
			loginPage.submit();
		});

		describe('email / username: ', () => {
			it('it should be required', () => {
				loginPage.emailOrUsernameField.getAttribute('class').should.contain('error');
				loginPage.emailOrUsernameInvalidText.getText().should.not.be.empty;
			});
		});

		describe('password: ', () => {
			it('it should be required', () => {
				loginPage.passwordField.getAttribute('class').should.contain('error');
				loginPage.passwordInvalidText.getText().should.not.be.empty;
			});
		});
	});
});
