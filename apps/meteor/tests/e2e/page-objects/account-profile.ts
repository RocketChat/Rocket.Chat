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

	// TODO: remove this locator
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

	get preferencesSoundAccordionOption(): Locator {
		return this.page.locator('h2:has-text("Sound")');
	}

	get preferencesCallRingerVolumeSlider(): Locator {
		return this.page.getByRole('slider', { name: 'Call Ringer Volume' });
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

	get btnTokenAddedOk(): Locator {
		return this.tokenAddedModal.locator('role=button[name="Ok"]');
	}

	get tokensRows(): Locator {
		return this.page.locator('table tbody tr');
	}

	tokenInTable(name: string): Locator {
		return this.page.locator(`tr[qa-token-name="${name}"]`);
	}

	get btnRegenerateTokenModal(): Locator {
		return this.page.locator('role=button[name="Regenerate token"]');
	}

	get removeTokenModal(): Locator {
		return this.page.locator('role=dialog', { hasText: 'personal access token' });
	}

	get btnRemoveTokenModal(): Locator {
		return this.removeTokenModal.getByRole('button', { name: 'Remove' });
	}

	get inputImageFile(): Locator {
		return this.page.locator('input[type=file]');
	}

	get securityHeader(): Locator {
		return this.page.locator('h1[data-qa-type="PageHeader-title"]:has-text("Security")');
	}

	get securityPasswordSection(): Locator {
		return this.page.locator('[role="button"]:has-text("Password")');
	}

	get security2FASection(): Locator {
		return this.page.locator('[role="button"]:has-text("Two Factor Authentication")');
	}

	get securityE2EEncryptionSection(): Locator {
		return this.page.locator('[role="button"]:has-text("End-to-end encryption")');
	}

	get securityE2EEncryptionResetKeyButton(): Locator {
		return this.page.locator("role=button[name='Reset E2EE key']");
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

	getAccordionItemByName(name: string): Locator {
		return this.page.getByRole('button', { name, exact: true });
	}

	getCheckboxByLabelText(name: string): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name }) });
	}

	get btnSaveChanges(): Locator {
		return this.page.getByRole('button', { name: 'Save changes', exact: true });
	}

	get email2FASwitch(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Two-factor authentication via email' }) });
	}

	get totp2FASwitch(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Two-factor authentication via TOTP' }) });
	}

	get required2faModalSetUpButton(): Locator {
		return this.page.locator('dialog >> button');
	}
}
