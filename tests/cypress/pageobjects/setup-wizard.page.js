import Page from './Page';
// import { adminEmail, adminPassword } from '../../data/user';

class SetupWizard extends Page {
	get fullname() { return cy.get('input[name="fullname"]'); }

	get username() { return cy.get('input[name="username"]'); }

	get companyEmail() { return cy.get('input[name="companyEmail"]'); }

	get password() { return cy.get('input[name="password"]'); }

	get organizationName() { return cy.get('input[name="organizationName"]'); }

	get nextButton() { return cy.get('button[type="submit"]'); }

	get nextStep() { return browser.element('[data-qa="setup-wizard"] [data-qa="active-step"] [data-qa="next-step"]'); }

	get goToWorkspace() { return browser.element('[data-qa="setup-wizard"] [data-qa="go-to-workspace"]'); }

	get organizationType() { return browser.element('[data-qa="setup-wizard"] [data-qa="Organization_Type"]'); }

	// get organizationName() { return browser.element('[data-qa="setup-wizard"] [data-qa="Organization_Name"]'); }

	get industry() { return browser.element('[data-qa="setup-wizard"] [data-qa="Industry"]'); }

	get size() { return browser.element('[data-qa="setup-wizard"] [data-qa="Size"]'); }

	get country() { return browser.element('[data-qa="setup-wizard"] [data-qa="Country"]'); }

	get website() { return browser.element('[data-qa="setup-wizard"] [data-qa="Website"]'); }

	get siteName() { return browser.element('[data-qa="setup-wizard"] [data-qa="Site_Name"]'); }

	get language() { return browser.element('[data-qa="setup-wizard"] [data-qa="Language"]'); }

	get serverType() { return browser.element('[data-qa="setup-wizard"] [data-qa="Server_Type"]'); }

	get registeredServer() { return browser.element('[data-qa="setup-wizard"] [data-qa="register-server"]'); }

	get standaloneServer() { return browser.element('[data-qa="setup-wizard"] [data-qa="register-server-standalone"]'); }

	get serviceTermsAndPrivacyPolicyLabel() { return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]').parent(); }

	get serviceTermsAndPrivacyPolicy() { return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]'); }

	open() {
		super.open('');
	}

	// login() {
	// 	cy.login(adminEmail, adminPassword);
	// }

	fillAdminInfo({ adminFullname, adminUsername, adminEmail, adminPassword }) {
		this.fullname.type(adminFullname);
		this.username.type(adminUsername);
		this.companyEmail.type(adminEmail);
		this.password.type(adminPassword);
	}

	goNext() {
		this.nextStep.click();
	}

	goToNextStep() {
		this.nextButton.click();
	}

	goToHome() {
		this.goToWorkspace.click();
	}
}

module.exports = new SetupWizard();
