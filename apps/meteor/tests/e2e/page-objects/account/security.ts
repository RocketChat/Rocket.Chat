import type { Locator, Page } from '@playwright/test';

import { AccountSidenav } from '../fragments/account-sidenav';

class AccountSecurityPasswordSection {
	constructor(private readonly page: Page) {}

	get toggleButton(): Locator {
		return this.page.locator('[role="button"]:has-text("Password")');
	}
}

class AccountSecurityE2EESection {
	constructor(readonly page: Page) {}

	get toggleButton(): Locator {
		return this.page.locator('[role="button"]:has-text("E2E Encryption")');
	}

	get resetE2EKeyButton(): Locator {
		return this.page.locator("role=button[name='Reset E2E Key']");
	}

	get newEncryptionPasswordField(): Locator {
		return this.page.locator('role=textbox[name="New encryption password"]');
	}

	get confirmNewEncryptionPasswordField(): Locator {
		return this.page.locator('role=textbox[name="Confirm new encryption password"]');
	}
}

class AccountSecurity2FASection {
	constructor(readonly page: Page) {}

	get toggleButton(): Locator {
		return this.page.locator('[role="button"]:has-text("Two Factor Authentication")');
	}
}

export class AccountSecurityPage {
	readonly sidenav: AccountSidenav;

	readonly password: AccountSecurityPasswordSection;

	readonly e2ee: AccountSecurityE2EESection;

	readonly twoFactorAuthentication: AccountSecurity2FASection;

	constructor(readonly page: Page) {
		this.sidenav = new AccountSidenav(page);
		this.password = new AccountSecurityPasswordSection(page);
		this.e2ee = new AccountSecurityE2EESection(page);
		this.twoFactorAuthentication = new AccountSecurity2FASection(page);
	}

	get header(): Locator {
		return this.page.locator('h1[data-qa-type="PageHeader-title"]:has-text("Security")');
	}

	get saveChangesButton(): Locator {
		return this.page.locator("role=button[name='Save changes']");
	}

	get unathorizedToViewPageMessage(): Locator {
		return this.page.locator('.main-content').getByText('You are not authorized to view this page.').first();
	}

	async goto() {
		await this.page.goto('/account/security');
	}
}
