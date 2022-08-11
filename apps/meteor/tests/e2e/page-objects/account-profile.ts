import type { Locator, Page } from '@playwright/test';

import { AccountSidenav } from './fragments/account-sidenav';

export class AccountProfile {
	private readonly page: Page;

	readonly sidenav: AccountSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new AccountSidenav(page);
	}

	get inputName(): Locator {
		return this.page.locator('//label[contains(text(), "Name")]/..//input');
	}

	get inputAvatarLink(): Locator {
		return this.page.locator('[data-qa-id="UserAvatarEditorLink"]');
	}

	get btnSetAvatarLink(): Locator {
		return this.page.locator('[data-qa-id="UserAvatarEditorSetAvatarLink"]');
	}

	get inputUsername(): Locator {
		return this.page.locator('//label[contains(text(), "Username")]/..//input');
	}

	get btnSubmit(): Locator {
		return this.page.locator('[data-qa="AccountProfilePageSaveButton"]');
	}

	get avatarFileInput(): Locator {
		return this.page.locator('.avatar-file-input');
	}

	get emailTextInput(): Locator {
		return this.page.locator('//label[contains(text(), "Email")]/..//input');
	}

	get btnClose(): Locator {
		return this.page.locator('button >> i.rcx-icon--name-cross.rcx-icon');
	}

	get inputToken(): Locator {
		return this.page.locator('[data-qa="PersonalTokenField"]');
	}

	get tokensTableEmpty(): Locator {
		return this.page.locator('//div[contains(text(), "No results found")]');
	}

	get btnTokensAdd(): Locator {
		return this.page.locator('//button[contains(text(), "Add")]');
	}

	get tokenAddedModal(): Locator {
		return this.page.locator("//div[text()='Personal Access Token successfully generated']");
	}

	tokenInTable(name: string): Locator {
		return this.page.locator(`tr[qa-token-name="${name}"]`);
	}

	get btnRegenerateTokenModal(): Locator {
		return this.page.locator('//button[contains(text(), "Regenerate token")]');
	}

	get btnRemoveTokenModal(): Locator {
		return this.page.locator('//button[contains(text(), "Remove")]');
	}

	get inputImageFile(): Locator {
		return this.page.locator('input[type=file]');
	}
}
