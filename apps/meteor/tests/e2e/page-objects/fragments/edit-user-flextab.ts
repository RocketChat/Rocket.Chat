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
		return this.root.locator('//label[text()="Name"]/following-sibling::span//input');
	}

	get inputUserName(): Locator {
		return this.root.locator('//label[text()="Username"]/following-sibling::span//input');
	}

	get inputEmail(): Locator {
		return this.root.locator('//label[text()="Email"]/following-sibling::span//input').first();
	}

	get inputSetManually(): Locator {
		return this.root.locator('//label[text()="Set manually"]');
	}

	get inputPassword(): Locator {
		return this.root.locator('input[placeholder="Password"]');
	}

	get inputConfirmPassword(): Locator {
		return this.root.locator('input[placeholder="Confirm password"]');
	}

	get joinDefaultChannels(): Locator {
		return this.root.locator('//label[text()="Join default channels"]');
	}

	get userRole(): Locator {
		return this.root.locator('button[role="option"]:has-text("user")');
	}

	get setupSmtpLink(): Locator {
		return this.root.locator('role=link[name="Set up SMTP"]');
	}

	getCustomField(fieldName: string): Locator {
		return this.root.getByRole('textbox', { name: fieldName });
	}
}
