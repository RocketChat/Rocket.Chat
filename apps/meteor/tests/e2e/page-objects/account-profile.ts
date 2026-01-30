import type { Locator, Page } from '@playwright/test';

import { Account } from './account';

export class AccountProfile extends Account {
	constructor(page: Page) {
		super(page);
	}

	get inputName(): Locator {
		return this.page.locator('//label[contains(text(), "Name")]/..//input');
	}

	get inputAvatarLink(): Locator {
		return this.page.getByRole('textbox', { name: 'Use URL for avatar' });
	}

	get btnSetAvatarLink(): Locator {
		return this.page.getByRole('button', { name: 'Add URL', exact: true });
	}

	get inputUsername(): Locator {
		return this.page.locator('//label[contains(text(), "Username")]/..//input');
	}

	// TODO: remove this locator
	get btnSubmit(): Locator {
		return this.page.getByRole('button', { name: 'Save changes', exact: true });
	}

	get avatarFileInput(): Locator {
		return this.page.locator('.avatar-file-input');
	}

	get userAvatarEditor(): Locator {
		return this.page.getByAltText('profile picture');
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

	getAccordionItemByName(name: string): Locator {
		return this.page.getByRole('button', { name, exact: true });
	}

	getCheckboxByLabelText(name: string): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name }) });
	}

	get btnSaveChanges(): Locator {
		return this.page.getByRole('button', { name: 'Save changes', exact: true });
	}

	get btnDeleteMyAccount(): Locator {
		return this.page.getByRole('button', { name: 'Delete my account' });
	}

	get deleteAccountDialog(): Locator {
		return this.page.getByRole('dialog', { name: 'Delete account?' });
	}

	get deleteAccountDialogMessageWithPassword(): Locator {
		return this.deleteAccountDialog.getByText('Enter your password to delete your account. This cannot be undone.');
	}

	get inputDeleteAccountPassword(): Locator {
		return this.deleteAccountDialog.getByRole('textbox', { name: 'Enter your password to delete your account. This cannot be undone.' });
	}

	get btnDeleteAccountConfirm(): Locator {
		return this.deleteAccountDialog.getByRole('button', { name: 'Delete Account' });
	}

	get btnDeleteAccountCancel(): Locator {
		return this.deleteAccountDialog.getByRole('button', { name: 'Cancel' });
	}

	get profileTitle(): Locator {
		return this.page.getByRole('heading', { name: 'Profile' });
	}
}
