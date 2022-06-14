import { expect, Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class PreferencesMainContent extends BasePage {
	get realNameTextInput(): Locator {
		return this.page.locator('//label[contains(text(), "Name")]/..//input');
	}

	get userNameTextInput(): Locator {
		return this.page.locator('//label[contains(text(), "Username")]/..//input');
	}

	get emailTextInput(): Locator {
		return this.page.locator('//label[contains(text(), "Email")]/..//input');
	}

	get passwordTextInput(): Locator {
		return this.page.locator('//label[contains(text(), "Password")]/..//input');
	}

	get avatarFileInput(): Locator {
		return this.page.locator('.avatar-file-input');
	}

	get useUploadedAvatar(): Locator {
		return this.page.locator('.avatar-suggestion-item:nth-of-type(2) .select-service');
	}

	get submitBtn(): Locator {
		return this.page.locator('[data-qa="AccountProfilePageSaveButton"]');
	}

	public async changeUsername(userName: string): Promise<void> {
		await this.userNameTextInput.fill(userName);
	}

	public async changeRealName(realName: string): Promise<void> {
		await this.realNameTextInput.fill(realName);
	}

	public async saveChanges(): Promise<void> {
		await expect(this.submitBtn).toBeEnabled();
		await this.submitBtn.click();
	}
}
