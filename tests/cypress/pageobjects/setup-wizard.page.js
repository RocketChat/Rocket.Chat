import Page from './Page';
import { adminEmail, adminPassword } from '../../data/user';

class SetupWizard extends Page {
	get nextStep() {
		return browser.element('button:contains("Next"):visible');
	}

	get goToWorkspace() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="go-to-workspace"]');
	}

	get organizationType() {
		return browser.element('[name="organizationType"]');
	}

	get organizationName() {
		return browser.element('[name="organizationName"]');
	}

	get industry() {
		return browser.element('[name="organizationIndustry"]');
	}

	get size() {
		return browser.element('[name="organizationSize"]');
	}

	get country() {
		return browser.element('[name="country"]');
	}

	get website() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="Website"]');
	}

	get siteName() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="Site_Name"]');
	}

	get language() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="Language"]');
	}

	get serverType() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="Server_Type"]');
	}

	get registeredServer() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="register-server"]');
	}

	get standaloneServer() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="register-server-standalone"]');
	}

	get serviceTermsAndPrivacyPolicyLabel() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]').parent();
	}

	get serviceTermsAndPrivacyPolicy() {
		return browser.element('[data-qa="setup-wizard"] [data-qa="agree-terms-and-privacy"]');
	}

	login() {
		cy.login(adminEmail, adminPassword);
	}

	goNext() {
		this.nextStep.click();
	}

	goToHome() {
		this.goToWorkspace.click();
	}
}

export default new SetupWizard();
