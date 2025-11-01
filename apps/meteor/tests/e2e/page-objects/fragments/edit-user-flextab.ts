import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class EditUserFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog'));
	}

	get btnAddUser(): Locator {
		return this.root.locator('role=button[name="Add user"]');
	}

	get btnSaveUser(): Locator {
		return this.root.locator('role=button[name="Save user"]');
	}

	get inputName(): Locator {
		return this.root.getByRole('textbox', { name: 'Name', exact: true });
	}

	get inputUserName(): Locator {
		return this.root.getByRole('textbox', { name: 'Username', exact: true });
	}

	get inputEmail(): Locator {
		return this.root.getByRole('textbox', { name: 'Email', exact: true });
	}

	get inputSetManually(): Locator {
		return this.root.locator('//label[text()="Set manually"]');
	}

	get inputPassword(): Locator {
		return this.root.getByPlaceholder('Password', { exact: true });
	}

	get inputConfirmPassword(): Locator {
		return this.root.getByPlaceholder('Confirm password', { exact: true });
	}

	get joinDefaultChannels(): Locator {
		return this.root.locator('//label[text()="Join default channels"]');
	}

	get userRole(): Locator {
		return this.root.locator('button[role="option"]:has-text("user")');
	}

	get setupSmtpLink(): Locator {
		return this.root.getByRole('link', { name: 'Set up SMTP' });
	}

	getCustomField(fieldName: string): Locator {
		return this.root.getByRole('textbox', { name: fieldName, exact: true });
	}
}
