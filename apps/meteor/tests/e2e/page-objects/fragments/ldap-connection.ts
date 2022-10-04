import type { Locator, Page } from '@playwright/test';

export class LdapConnection {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnEnable(): Locator {
		return this.page.locator('[data-qa-setting-id="LDAP_Enable"]');
	}

	async selectLdapServerType(): Promise<void> {
		await this.page.locator('[data-qa-setting-id="LDAP_Server_Type"]').click();
		await this.page.locator('.rcx-option__content >> text="Other"').click();
	}

	get inputLdapHost(): Locator {
		return this.page.locator('[data-qa-setting-id="LDAP_Host"]');
	}

	get btnLdapReconnect(): Locator {
		return this.page.locator('[data-qa-setting-id="LDAP_Reconnect"]');
	}

	get btnLoginFallBack(): Locator {
		return this.page.locator('[data-qa-setting-id="LDAP_Login_Fallback"]');
	}

	get btnSaveChanges(): Locator {
		return this.page.locator('.rcx-button--primary.rcx-button.save >> text="Save changes"');
	}

	get btnTestConnection(): Locator {
		return this.page.locator('.rcx-button.rcx-button-group__item >> text="Test Connection"');
	}
}
