import { Locator } from '@playwright/test';

import { BasePage } from './BasePage';

export class PreferencesMainContent extends BasePage {
	get inputRealNameText(): Locator {
		return this.page.locator('//label[contains(text(), "Name")]/..//input');
	}

	get inputUserNameText(): Locator {
		return this.page.locator('//label[contains(text(), "Username")]/..//input');
	}

	get inputEmailText(): Locator {
		return this.page.locator('//label[contains(text(), "Email")]/..//input');
	}

	get inputPasswordText(): Locator {
		return this.page.locator('//label[contains(text(), "Password")]/..//input');
	}

	get btnResendVerificationEmail(): Locator {
		return this.page.locator('#resend-verification-email');
	}

	get inputAvatarFile(): Locator {
		return this.page.locator('.avatar-file-input');
	}

	get useUploadedAvatar(): Locator {
		return this.page.locator('.avatar-suggestion-item:nth-of-type(2) .select-service');
	}

	get btnSubmit(): Locator {
		return this.page.locator('[data-qa="AccountProfilePageSaveButton"]');
	}
}
