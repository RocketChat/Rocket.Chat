import loginPage from '../pageobjects/login.page';
import setupWizard from '../pageobjects/setup-wizard.page';

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
			setupWizard.size.click();
			cy.get('.rcx-options .rcx-option:first-child').click();
			cy.wait(100);
			setupWizard.industry.click();
			cy.get('.rcx-options .rcx-option:first-child').click();
			cy.wait(100);
			setupWizard.country.click();
			cy.get('.rcx-options .rcx-option:first-child').click();
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
