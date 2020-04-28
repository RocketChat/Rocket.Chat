import Page from './Page';

class PreferencesMainContent extends Page {
	get formTextInput() { return browser.element('.rocket-form'); }

	get realNameTextInput() { return browser.element('input[name="realname"]'); }

	get userNameTextInput() { return browser.element('input[name="username"]'); }

	get emailTextInput() { return browser.element('[name="email"]'); }

	get passwordTextInput() { return browser.element('[name="password"]'); }

	get resendVerificationEmailBtn() { return browser.element('#resend-verification-email'); }

	get avatarFileInput() { return browser.element('.avatar-file-input'); }

	get useUploadedAvatar() { return browser.element('.avatar-suggestion-item:nth-of-type(2) .select-service'); }

	get submitBtn() { return browser.element('.rc-button[type="submit"]'); }

	realNameTextInputEnabled() { return browser.isEnabled('input[name="realname"]'); }

	userNameTextInputEnabled() { return browser.isEnabled('input[name="username"]'); }

	changeUsername(userName) {
		this.userNameTextInput.clear().type(userName);
	}

	changeRealName(realName) {
		this.realNameTextInput.clear().type(realName);
	}

	changeEmail(email) {
		this.emailTextInput.clear().type(email);
	}

	saveChanges() {
		cy.get('.rc-button[type="submit"]').should('be.enabled');
		this.submitBtn.click();
	}

	changeAvatarUpload(url) {
		this.avatarFileInput.chooseFile(url);
		this.useUploadedAvatar.click();
	}
}


module.exports = new PreferencesMainContent();
