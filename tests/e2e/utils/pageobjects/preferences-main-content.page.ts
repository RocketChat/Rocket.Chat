import { expect, Locator } from '@playwright/test';

import BasePage from './BasePage';

class PreferencesMainContent extends BasePage {
	public formTextInput() {
		return this.getPage().locator('.rocket-form');
	}

	public realNameTextInput() {
		return this.getPage().locator('label:contains("Name")').closest('.rcx-field').find('input');
	}

	public userNameTextInput() {
		return this.getPage().locator('label:contains("Username")').closest('.rcx-field').find('input');
	}

	public emailTextInput() {
		return this.getPage().locator('label:contains("Email")').closest('.rcx-field').find('input');
	}

	public passwordTextInput() {
		return this.getPage().locator('label:contains("Password")').closest('.rcx-field').find('input');
	}

	public resendVerificationEmailBtn() {
		return this.getPage().locator('#resend-verification-email');
	}

	public avatarFileInput() {
		return this.getPage().locator('.avatar-file-input');
	}

	public useUploadedAvatar() {
		return this.getPage().locator('.avatar-suggestion-item:nth-of-type(2) .select-service');
	}

	public submitBtn() {
		return this.getPage().locator('button:contains("Save changes")');
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

export default PreferencesMainContent;
