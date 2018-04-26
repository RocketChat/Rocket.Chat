import Page from './Page';
import mainContent from './main-content.page';

class SetupWizard extends Page {
	get nextButton() { return browser.element('.setup-wizard-forms__footer-next'); }
	get goToWorkspace() { return browser.element('button.js-finish'); }
	get organizationType() { return browser.element('select[name="Organization_Type"]'); }
	get organizationName() { return browser.element('input[name="Organization_Name"]'); }
	get industry() { return browser.element('select[name="Industry"]'); }
	get size() { return browser.element('select[name="Size"]'); }
	get country() { return browser.element('select[name="Country"]'); }
	get website() { return browser.element('input[name="Website"]'); }
	get siteName() { return browser.element('input[name="Site_Name"]'); }
	get language() { return browser.element('select[name="Language"]'); }
	get serverType() { return browser.element('select[name="Server_Type"]'); }

	goNext() {
		this.nextButton.waitForVisible(5000);
		this.nextButton.click();
	}

	goToHome() {
		this.goToWorkspace.waitForVisible(5000);
		this.goToWorkspace.click();
	}
}

module.exports = new SetupWizard();
