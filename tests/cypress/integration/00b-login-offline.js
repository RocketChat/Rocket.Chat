import loginPage from '../pageobjects/login.page';

describe('Test login page in Offline', () => {
	before(() => {
		localStorage.clear();
		loginPage.open();
		// time to register sw
		cy.wait(5000);
		loginPage.gotToForgotPassword();
		loginPage.gotBackToLogin();
		loginPage.gotToRegister();
		loginPage.gotBackToLogin();
	});

	describe('[Render]', () => {
		before(() => {
			loginPage.offlineMode(true);
		});

		it('it should show reconnecting alert', () => {
			loginPage.warningAlert.should('be.visible');
		});

		it('it should show email / username field', () => {
			loginPage.emailOrUsernameField.should('be.visible');
		});

		it('it should show password field', () => {
			loginPage.passwordField.should('be.visible');
		});

		it('it should show submit button', () => {
			loginPage.submitButton.should('be.visible');
		});

		it('it should show register button', () => {
			loginPage.registerButton.should('be.visible');
		});

		it('it should show forgot password button', () => {
			loginPage.forgotPasswordButton.should('be.visible');
		});

		it('it should not show name field', () => {
			loginPage.nameField.should('not.be.visible');
		});

		it('it should not show email field', () => {
			loginPage.emailField.should('not.be.visible');
		});

		it('it should not show confirm password field', () => {
			loginPage.confirmPasswordField.should('not.be.visible');
		});

		it('it should not show back to login button', () => {
			loginPage.backToLoginButton.should('not.be.visible');
		});
	});

	describe('[Required Fields]', () => {
		before(() => {
			loginPage.submit();
		});

		describe('email / username: ', () => {
			it('it should be required', () => {
				loginPage.emailOrUsernameField.should('have.class', 'error');
				loginPage.emailOrUsernameInvalidText.get('text').should('not.be.empty');
			});
		});

		describe('password: ', () => {
			it('it should be required', () => {
				loginPage.passwordField.should('have.class', 'error');
				loginPage.passwordInvalidText.get('text').should('not.be.empty');
			});
		});
	});
});


describe('Test Registration Page in Offline', () => {
	before(() => {
		loginPage.open();
		loginPage.offlineMode(true);
		loginPage.gotToRegister();
	});

	describe('render:', () => {
		it('it should show reconnecting alert', () => {
			loginPage.warningAlert.should('be.visible');
		});

		it('it should show name field', () => {
			loginPage.nameField.should('be.visible');
		});

		it('it should show email field', () => {
			loginPage.emailField.should('be.visible');
		});

		it('it should show password field', () => {
			loginPage.passwordField.should('be.visible');
		});

		it('it should show confirm password field', () => {
			loginPage.confirmPasswordField.should('be.visible');
		});

		it('it should not show email / username field', () => {
			loginPage.emailOrUsernameField.should('not.be.visible');
		});

		it('it should show submit button', () => {
			loginPage.submitButton.should('be.visible');
		});

		it('it should not show register button', () => {
			loginPage.registerButton.should('not.be.visible');
		});

		it('it should not show forgot password button', () => {
			loginPage.forgotPasswordButton.should('not.be.visible');
		});

		it('it should show back to login button', () => {
			loginPage.backToLoginButton.should('be.visible');
		});
	});

	describe('name:', () => {
		it('it should be required', () => {
			loginPage.submit();
			loginPage.nameField.should('have.class', 'error');
			loginPage.nameInvalidText.get('text').should('not.be.empty');
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

	describe('password:', () => {
		it('it should be required', () => {
			loginPage.submit();
			loginPage.passwordField.should('have.class', 'error');
			loginPage.passwordInvalidText.get('text').should('not.be.empty');
		});
	});

	describe('confirm-password:', () => {
		it('it should be invalid if different from password', () => {
			loginPage.passwordField.type('password');
			loginPage.submit();
			loginPage.confirmPasswordField.should('have.class', 'error');
			loginPage.confirmPasswordInvalidText.get('text').should('not.be.empty');
		});

		it('it should be valid if equal to password', () => {
			loginPage.confirmPasswordField.type('password');
			loginPage.submit();
			loginPage.passwordField.should('not.have.class', 'error');
			loginPage.passwordInvalidText.should('not.have.text');
		});
	});
});


describe('Test Forgot Password in Offline', () => {
	before(() => {
		loginPage.open();
		loginPage.offlineMode(true);
		loginPage.gotToForgotPassword();
	});

	describe('render:', () => {
		it('it should show reconnecting alert', () => {
			loginPage.warningAlert.should('be.visible');
		});

		it('it should not show name field', () => {
			loginPage.nameField.should('not.be.visible');
		});

		it('it should show email field', () => {
			loginPage.emailField.should('be.visible');
		});

		it('it should not show password field', () => {
			loginPage.passwordField.should('not.be.visible');
		});

		it('it should not show confirm password field', () => {
			loginPage.confirmPasswordField.should('not.be.visible');
		});

		it('it should not show email / username field', () => {
			loginPage.emailOrUsernameField.should('not.be.visible');
		});

		it('it should show submit button', () => {
			loginPage.submitButton.should('be.visible');
		});

		it('it should not show register button', () => {
			loginPage.registerButton.should('not.be.visible');
		});

		it('it should not show forgot password button', () => {
			loginPage.forgotPasswordButton.should('not.be.visible');
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
