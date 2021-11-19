import setupWizard from '../pageobjects/setup-wizard.page';
import { adminFullname, adminUsername, adminEmail, adminPassword } from '../../data/user.js';

describe('[Setup Wizard]', () => {
	before(() => {
		// loginPage.open();
		setupWizard.open();
		// setupWizard.login();
	});

	describe('Render - AdminInfo', () => {
		it('should show fullname field', () => {
			setupWizard.fullname.should('be.visible');
		});

		it('should show username field', () => {
			setupWizard.username.should('be.visible');
		});

		it('should show companyEmail field', () => {
			setupWizard.companyEmail.should('be.visible');
		});

		it('should show password field', () => {
			setupWizard.password.should('be.visible');
		});

		after(() => {
			setupWizard.fillAdminInfo({ adminFullname, adminUsername, adminEmail, adminPassword });
			setupWizard.goToNextStep();
		});
	});

	describe('Render - OrganizationInfo', () => {
		it('should show organizationName field', () => {
			setupWizard.organizationName.should('be.visible');
		});
	});

	// describe('[Render - Step 1]', () => {
	// 	it('it should show organization type', () => {
	// 		setupWizard.organizationType.should('be.visible');
	// 	});

	// 	it('it should show organization name', () => {
	// 		setupWizard.organizationName.should('be.visible');
	// 	});

	// 	it('it should show industry', () => {
	// 		setupWizard.industry.should('be.visible');
	// 	});

	// 	it('it should show size', () => {
	// 		setupWizard.size.should('be.visible');
	// 	});

	// 	it('it should show country', () => {
	// 		setupWizard.country.should('be.visible');
	// 	});

	// 	it('it should show website', () => {
	// 		setupWizard.website.scrollIntoView().should('be.visible');
	// 	});

	// 	after(() => {
	// 		setupWizard.goNext();
	// 	});
	// });

	// describe('[Render - Step 2]', () => {
	// 	it('it should show site name', () => {
	// 		setupWizard.siteName.should('be.visible');
	// 	});

	// 	it('it should show language', () => {
	// 		setupWizard.language.should('be.visible');
	// 	});

	// 	it('it should server type', () => {
	// 		setupWizard.serverType.should('be.visible');
	// 	});

	// 	after(() => {
	// 		setupWizard.goNext();
	// 	});
	// });

	// describe('[Render - Step 3]', () => {
	// 	it('it should have option for registered server', () => {
	// 		setupWizard.registeredServer.should('be.visible');
	// 	});

	// 	it('it should have option for standalone server', () => {
	// 		setupWizard.standaloneServer.should('be.visible');
	// 	});

	// 	it('it should check option for registered server by default', () => {
	// 		setupWizard.registeredServer.should('be.checked');
	// 	});

	// 	it('it should check if agree to privacy policy is false', () => {
	// 		setupWizard.serviceTermsAndPrivacyPolicy.should('not.be.checked');
	// 	});

	// 	it('it should click agree to privacy policy and check if true', () => {
	// 		setupWizard.serviceTermsAndPrivacyPolicyLabel.scrollIntoView().click();
	// 		setupWizard.serviceTermsAndPrivacyPolicy.should('be.checked');
	// 	});

	// 	after(() => {
	// 		setupWizard.goNext();
	// 	});
	// });

	// describe('[Render - Final Step]', () => {
	// 	it('it should render "Go to your workspace button', () => {
	// 		setupWizard.goToWorkspace.should('be.visible');
	// 	});

	// 	after(() => {
	// 		setupWizard.goToHome();
	// 	});
	// });

	// after(() => {
	// 	cy.logout();
	// });
});
