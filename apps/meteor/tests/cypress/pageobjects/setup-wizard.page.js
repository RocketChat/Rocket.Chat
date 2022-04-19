import Page from './Page';
import { adminEmail, adminPassword } from '../../data/user';

class SetupWizard extends Page {
	get nextStep() {
		return browser.element('button:contains("Next"):visible');
	}

	get goToWorkspace() {
		return browser.element('button:contains("Confirm")');
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

	get registeredServer() {
		return browser.element('input[name=email]');
	}

	get registerButton() {
		return browser.element('button:contains("Register")');
	}

	get agreementField() {
		return browser.element('input[name=agreement]').closest('.rcx-check-box');
	}

	get standaloneServer() {
		return browser.element('button:contains("Continue as standalone")');
	}

	get standaloneConfirmText() {
		return browser.element('.rcx-box:contains("Standalone Server Confirmation")');
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
