import Page from './Page';

class PreferencesMainContent extends Page {
	get formTextInput() {
		return browser.element('.rocket-form');
	}

	get realNameTextInput() {
		return browser.element('label:contains("Name")').closest('.rcx-field').find('input');
	}

	get userNameTextInput() {
		return browser.element('label:contains("Username")').closest('.rcx-field').find('input');
	}

	get emailTextInput() {
		return browser.element('label:contains("Email")').closest('.rcx-field').find('input');
	}

	get passwordTextInput() {
		return browser.element('label:contains("Password")').closest('.rcx-field').find('input');
	}

	get resendVerificationEmailBtn() {
		return browser.element('#resend-verification-email');
	}

	get avatarFileInput() {
		return browser.element('.avatar-file-input');
	}

	get useUploadedAvatar() {
		return browser.element('.avatar-suggestion-item:nth-of-type(2) .select-service');
	}

	get submitBtn() {
		return browser.element('button:contains("Save changes")');
	}

	realNameTextInputEnabled() {
		return browser.isEnabled('input[name="realname"]');
	}

	userNameTextInputEnabled() {
		return browser.isEnabled('input[name="username"]');
	}

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
		this.submitBtn.should('be.enabled');
		this.submitBtn.click();
	}

	changeAvatarUpload(url) {
		this.avatarFileInput.chooseFile(url);
		this.useUploadedAvatar.click();
	}
}

export default new PreferencesMainContent();
