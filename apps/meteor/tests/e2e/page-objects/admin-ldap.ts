import type { Locator, Page } from '@playwright/test';

import { LdapConnection } from './fragments/ldap-connection';

export class AdminLdap {
	private readonly page: Page;

	readonly ldapConnection: LdapConnection;

	constructor(page: Page) {
		this.page = page;
		this.ldapConnection = new LdapConnection(this.page);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}
}
