import Page from './Page';
// import { adminEmail, adminPassword } from '../../data/user';

class SetupWizard extends Page {
	get fullname() {
		return cy.get('input[name="fullname"]');
	}

	get username() {
		return cy.get('input[name="username"]');
	}

	get companyEmail() {
		return cy.get('input[name="companyEmail"]');
	}

	get password() {
		return cy.get('input[name="password"]');
	}

	get organizationName() {
		return cy.get('input[name="organizationName"]');
	}

	get organizationType() {
		return cy.get('div[name="organizationType"]');
	}

	get organizationIndustry() {
		return cy.get('div[name="organizationIndustry"]');
	}

	get organizationSize() {
		return cy.get('div[name="organizationSize"]');
	}

	get country() {
		return cy.get('div[name="country"]');
	}

	get nextButton() {
		return cy.get('button[type="submit"]');
	}

	get continueStandaloneButton() {
		return cy.get('.rcx-button').contains('Continue as standalone');
	}

	get serviceTermsAndPrivacyPolicyLabel() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]').parent();
	}

	get serviceTermsAndPrivacyPolicy() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]');
	}

	open() {
		super.open('');
	}

	// login() {
	// 	cy.login(adminEmail, adminPassword);
	// }

	fillAdminInfo({ userFullname, username, email, password }) {
		this.fullname.type(userFullname);
		this.username.type(username);
		this.companyEmail.type(email);
		this.password.type(password);
	}

	fillOrganizationInfo({ organizationName }) {
		this.organizationName.type(organizationName);
	}

	goToNextStep() {
		this.nextButton.click();
	}

	skipToStandalone() {
		this.continueStandaloneButton.click();
	}
}

module.exports = new SetupWizard();
