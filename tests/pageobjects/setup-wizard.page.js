import Page from './Page';
import { adminEmail, adminPassword } from '../data/user';

class SetupWizard extends Page {
	get nextStep() { return browser.element('[data-qa="setup-wizard"] [data-qa="active-step"] [data-qa="next-step"]'); }

	get goToWorkspace() { return browser.element('[data-qa="setup-wizard"] [data-qa="go-to-workspace"]'); }

	get organizationType() { return browser.element('[data-qa="setup-wizard"] [data-qa="Organization_Type"]'); }

	get organizationName() { return browser.element('[data-qa="setup-wizard"] [data-qa="Organization_Name"]'); }

	get industry() { return browser.element('[data-qa="setup-wizard"] [data-qa="Industry"]'); }

	get size() { return browser.element('[data-qa="setup-wizard"] [data-qa="Size"]'); }

	get country() { return browser.element('[data-qa="setup-wizard"] [data-qa="Country"]'); }

	get website() { return browser.element('[data-qa="setup-wizard"] [data-qa="Website"]'); }

	get siteName() { return browser.element('[data-qa="setup-wizard"] [data-qa="Site_Name"]'); }

	get language() { return browser.element('[data-qa="setup-wizard"] [data-qa="Language"]'); }

	get serverType() { return browser.element('[data-qa="setup-wizard"] [data-qa="Server_Type"]'); }

	get registeredServer() { return browser.element('[data-qa="setup-wizard"] [data-qa="register-server"]'); }

	get standaloneServer() { return browser.element('[data-qa="setup-wizard"] [data-qa="register-server-standalone"]'); }

	get serviceTermsAndPrivacyPolicyLabel() { return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]').$('..'); }

	get serviceTermsAndPrivacyPolicy() { return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]'); }

	login() {
		browser.execute(function(email, password) {
			Meteor.loginWithPassword(email, password, () => {});
		}, adminEmail, adminPassword);
	}

	goNext() {
		this.nextStep.waitForVisible(5000);
		this.nextStep.click();
	}

	goToHome() {
		this.goToWorkspace.waitForVisible(5000);
		this.goToWorkspace.click();
	}
}

module.exports = new SetupWizard();
