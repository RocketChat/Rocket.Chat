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

	get userAvatarEditor(): Locator {
		return this.page.locator('[data-qa-id="UserAvatarEditor"]');
	}

	get emailTextInput(): Locator {
		return this.page.locator('//label[contains(text(), "Email")]/..//input');
	}

	get btnClose(): Locator {
		return this.page.locator('role=navigation >> role=button[name=Close]');
	}

	get inputToken(): Locator {
		return this.page.locator('[data-qa="PersonalTokenField"]');
	}

	get tokensTableEmpty(): Locator {
		return this.page.locator('//h3[contains(text(), "No results found")]');
	}

	get btnTokensAdd(): Locator {
		return this.page.locator('role=button[name="Add"]');
	}

	get tokenAddedModal(): Locator {
		return this.page.locator('role=dialog[name="Personal Access Token successfully generated"]');
	}

	tokenInTable(name: string): Locator {
		return this.page.locator(`tr[qa-token-name="${name}"]`);
	}

	get btnRegenerateTokenModal(): Locator {
		return this.page.locator('role=button[name="Regenerate token"]');
	}

	get btnRemoveTokenModal(): Locator {
		return this.page.locator('role=button[name="Remove"]');
	}

	get inputImageFile(): Locator {
		return this.page.locator('input[type=file]');
	}

	get securityE2EEncryptionSection(): Locator {
		return this.page.locator('[role="button"]:has-text("E2E Encryption")');
	}

	get securityE2EEncryptionResetKeyButton(): Locator {
		return this.page.locator("role=button[name='Reset E2E Key']");
	}

	get securityE2EEncryptionPassword(): Locator {
		return this.page.locator('role=textbox[name="New encryption password"]');
	}

	get securityE2EEncryptionPasswordConfirmation(): Locator {
		return this.page.locator('role=textbox[name="Confirm new encryption password"]');
	}

	get securityE2EEncryptionSavePasswordButton(): Locator {
		return this.page.locator("role=button[name='Save changes']");
	}
}
