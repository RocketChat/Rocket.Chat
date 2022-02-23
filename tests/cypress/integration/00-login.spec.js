import loginPage from '../pageobjects/login.page';
import setupWizard from '../pageobjects/setup-wizard.page';

describe('[Login]', () => {
	before(() => {
		localStorage.clear();
		loginPage.open();
	});

	describe('[Render]', () => {
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
			loginPage.nameField.should('not.exist');
		});

		it('it should not show email field', () => {
			loginPage.emailField.should('not.exist');
		});

		it('it should not show confirm password field', () => {
			loginPage.confirmPasswordField.should('not.exist');
		});

		it('it should not show back to login button', () => {
			loginPage.backToLoginButton.should('not.exist');
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

describe('[Setup Wizard]', () => {
	before(() => {
		loginPage.open();
		setupWizard.login();
	});

	describe('[Render - Step 2]', () => {
		it('it should show organization name', () => {
			setupWizard.organizationName.should('be.visible');
		});

		it('it should show organization type', () => {
			setupWizard.organizationType.should('be.visible');
		});

		it('it should show industry', () => {
			setupWizard.industry.should('be.visible');
		});

		it('it should show size', () => {
			setupWizard.size.should('be.visible');
		});

		it('it should show country', () => {
			setupWizard.country.should('be.visible');
		});

		it('it should fill the form', () => {
			setupWizard.organizationName.type('Org Name');
			setupWizard.size.click().wait(100);
			cy.get('.rcx-options .rcx-option:first-child').click();
			cy.get('.rcx-options').should('not.exist');
			setupWizard.industry.click().wait(100);
			cy.get('.rcx-options .rcx-option:first-child').click();
			cy.get('.rcx-options').should('not.exist');
			setupWizard.country.click().wait(100);
			cy.get('.rcx-options .rcx-option:first-child').click();
			cy.get('.rcx-options').should('not.exist');
		});

		after(() => {
			setupWizard.goNext();
		});
	});

	describe('[Render - Step 3]', () => {
		it('it should have email field to register the server', () => {
			setupWizard.registeredServer.should('be.visible');
		});

		it('it should start with "Register" button disabled', () => {
			setupWizard.registerButton.should('be.disabled');
		});

		it('it should show an error on invalid email', () => {
			setupWizard.registeredServer.type('a');
			setupWizard.registeredServer.clear();
			cy.get('.rcx-field__error:contains("This field is required")').should('be.visible');
		});

		it('it should enable "Register" button when email is valid and terms checked', () => {
			setupWizard.registeredServer.type('email@email.com');
			setupWizard.agreementField.click();
			setupWizard.registerButton.should('be.enabled');
		});

		it('it should have option for standalone server', () => {
			setupWizard.standaloneServer.should('be.visible');
		});

		it('it should continue when clicking on "Continue as standalone"', () => {
			setupWizard.standaloneServer.click();
		});
	});

	describe('[Render - Final Step]', () => {
		it('it should confirm the standalone option', () => {
			setupWizard.goToWorkspace.should('be.visible');
			setupWizard.standaloneConfirmText.should('be.visible');
		});

		it('it should confirm standalone', () => {
			setupWizard.goToWorkspace.click();
		});
	});

	after(() => {
		cy.logout();
	});
});
