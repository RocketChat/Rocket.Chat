import { expect, Locator } from '@playwright/test';

import BasePage from './BasePage';

export default class PreferencesMainContent extends BasePage {
	public realNameTextInput(): Locator {
		return this.getPage().locator('//label[contains(text(), "Name")]/..//input');
	}

	public userNameTextInput(): Locator {
		return this.getPage().locator('//label[contains(text(), "Username")]/..//input');
	}

	public emailTextInput(): Locator {
		return this.getPage().locator('//label[contains(text(), "Email")]/..//input');
	}

	public passwordTextInput(): Locator {
		return this.getPage().locator('//label[contains(text(), "Password")]/..//input');
	}

	public avatarFileInput(): Locator {
		return this.getPage().locator('.avatar-file-input');
	}

	public useUploadedAvatar(): Locator {
		return this.getPage().locator('.avatar-suggestion-item:nth-of-type(2) .select-service');
	}

	public submitBtn(): Locator {
		return this.getPage().locator('[data-qa="AccountProfilePageSaveButton"]');
	}

	public async changeUsername(userName: string): Promise<void> {
		await this.userNameTextInput().fill(userName);
	}

	public async changeRealName(realName: string): Promise<void> {
		await this.realNameTextInput().fill(realName);
	}

	public async saveChanges(): Promise<void> {
		await expect(this.submitBtn()).toBeEnabled();
		await this.submitBtn().click();
	}
}
