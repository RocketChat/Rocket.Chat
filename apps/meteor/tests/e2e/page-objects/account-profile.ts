import type { Locator, Page } from '@playwright/test';

import { Account, AccountSectionsHref } from './account';
import { DeleteAccountModal } from './fragments';

export class AccountProfile extends Account {
	protected readonly route = AccountSectionsHref.profile;

	protected readonly title = 'Profile';

	readonly deleteAccountModal: DeleteAccountModal;

	constructor(page: Page) {
		super(page);
		this.deleteAccountModal = new DeleteAccountModal(page);
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

	get inputStatusText(): Locator {
		return this.page.getByRole('textbox', { name: 'Status' });
	}

	get selectClearStatusAfter(): Locator {
		return this.page.getByLabel('Clear status after');
	}

	async chooseClearStatusAfter(option: string): Promise<void> {
		await this.selectClearStatusAfter.click();
		await this.page.getByRole('option', { name: new RegExp(option) }).click();
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

	get profileHeading(): Locator {
		return this.page.getByRole('heading', { name: 'Profile', exact: true });
	}

	get btnDeleteMyAccount(): Locator {
		return this.page.getByRole('button', { name: 'Delete my account' });
	}

	private getErrorAlertByText(text: string): Locator {
		return this.page.getByRole('alert').filter({ hasText: text });
	}

	get errorInvalidUrl(): Locator {
		return this.getErrorAlertByText('Invalid image URL');
	}
}
