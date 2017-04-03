import Page from './Page';

class PreferencesMainContent extends Page {
	get formTextInput() { return browser.element('.rocket-form'); }
	get realNameTextInput() { return browser.element('[name="realname"]'); }
	get userNameTextInput() { return browser.element('[name="username"]'); }
	get emailTextInput() { return browser.element('[name="email"]'); }
	get passwordTextInput() { return browser.element('[name="password"]'); }
	get resendVerificationEmailBtn() { return browser.element('#resend-verification-email'); }
	get avatarFileInput() { return browser.element('.avatar-file-input'); }
	get useUploadedAvatar() { return browser.element('.avatar-suggestion-item:nth-of-type(2) .select-service'); }
	get submitBtn() { return browser.element('.submit .button'); }

	changeUsername(userName) {
		this.userNameTextInput.waitForVisible(5000);
		this.userNameTextInput.setValue(userName);
	}

	changeRealName(realName) {
		this.realNameTextInput.waitForVisible(5000);
		this.realNameTextInput.setValue(realName);
	}

	changeEmail(email) {
		this.emailTextInput.waitForVisible(5000);
		this.emailTextInput.setValue(email);
	}

	saveChanges() {
		this.submitBtn.waitForVisible(5000);
		this.submitBtn.click();
	}

	changeAvatarUpload(url) {
		this.avatarFileInput.chooseFile(url);
		this.useUploadedAvatar.click();
		browser.pause(1000);
	}
}



module.exports = new PreferencesMainContent();
