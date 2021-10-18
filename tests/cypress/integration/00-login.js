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

describe('[Setup Wizard]', () => {
	before(() => {
		loginPage.open();
		setupWizard.login();
	});

	describe('[Render - Step 1]', () => {
		it('it should show organization type', () => {
			setupWizard.organizationType.should('be.visible');
		});

		it('it should show organization name', () => {
			setupWizard.organizationName.should('be.visible');
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

		it('it should show website', () => {
			setupWizard.website.scrollIntoView().should('be.visible');
		});

		after(() => {
			setupWizard.goNext();
		});
	});

	describe('[Render - Step 2]', () => {
		it('it should show site name', () => {
			setupWizard.siteName.should('be.visible');
		});

		it('it should show language', () => {
			setupWizard.language.should('be.visible');
		});

		it('it should server type', () => {
			setupWizard.serverType.should('be.visible');
		});

		after(() => {
			setupWizard.goNext();
		});
	});

	describe('[Render - Step 3]', () => {
		it('it should have option for registered server', () => {
			setupWizard.registeredServer.should('be.visible');
		});

		it('it should have option for standalone server', () => {
			setupWizard.standaloneServer.should('be.visible');
		});

		it('it should check option for registered server by default', () => {
			setupWizard.registeredServer.should('be.checked');
		});

		it('it should check if agree to privacy policy is false', () => {
			setupWizard.serviceTermsAndPrivacyPolicy.should('not.be.checked');
		});

		it('it should click agree to privacy policy and check if true', () => {
			setupWizard.serviceTermsAndPrivacyPolicyLabel.scrollIntoView().click();
			setupWizard.serviceTermsAndPrivacyPolicy.should('be.checked');
		});

		after(() => {
			setupWizard.goNext();
		});
	});

	describe('[Render - Final Step]', () => {
		it('it should render "Go to your workspace button', () => {
			setupWizard.goToWorkspace.should('be.visible');
		});

		after(() => {
			setupWizard.goToHome();
		});
	});

	after(() => {
		cy.logout();
	});
});
