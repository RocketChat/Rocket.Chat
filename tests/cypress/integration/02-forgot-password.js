import loginPage from '../pageobjects/login.page';

describe('[Forgot Password]', () => {
	before(() => {
		loginPage.open();
		loginPage.gotToForgotPassword();
	});

	describe('render:', () => {
		it('it should not show name field', () => {
			loginPage.nameField.should('not.exist');
		});

		it('it should show email field', () => {
			loginPage.emailField.should('be.visible');
		});

		it('it should not show password field', () => {
			loginPage.passwordField.should('not.exist');
		});

		it('it should not show confirm password field', () => {
			loginPage.confirmPasswordField.should('not.exist');
		});

		it('it should not show email / username field', () => {
			loginPage.emailOrUsernameField.should('not.exist');
		});

		it('it should show submit button', () => {
			loginPage.submitButton.should('be.visible');
		});

		it('it should not show register button', () => {
			loginPage.registerButton.should('not.exist');
		});

		it('it should not show forgot password button', () => {
			loginPage.forgotPasswordButton.should('not.exist');
		});

		it('it should show back to login button', () => {
			loginPage.backToLoginButton.should('be.visible');
		});
	});

	describe('email:', () => {
		it('it should be required', () => {
			loginPage.submit();
			loginPage.emailField.should('have.class', 'error');
			loginPage.emailInvalidText.get('text').should('not.be.empty');
		});

		it('it should be invalid for email without domain', () => {
			loginPage.emailField.type('invalid-email');
			loginPage.submit();
			loginPage.emailField.should('have.class', 'error');
			loginPage.emailInvalidText.get('text').should('not.be.empty');
		});

		it('it should be invalid for email with invalid domain', () => {
			loginPage.emailField.type('invalid-email@mail');
			loginPage.submit();
			loginPage.emailField.should('have.class', 'error');
			loginPage.emailInvalidText.get('text').should('not.be.empty');
		});

		it.skip('it should be invalid for email space', () => {
			loginPage.emailField.type('invalid email@mail.com');
			loginPage.submit();
			loginPage.emailField.should('have.class', 'error');
			loginPage.emailInvalidText.get('text').should('not.be.empty');
		});
	});
});
