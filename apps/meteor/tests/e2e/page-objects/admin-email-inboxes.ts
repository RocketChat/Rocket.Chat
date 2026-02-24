import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';

export class AdminEmailInboxes extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get btnNewEmailInbox(): Locator {
		return this.page.locator('role=button[name="New Email Inbox"]');
	}

	get inputName(): Locator {
		return this.page.locator('input[name="name"]');
	}

	get inputEmail(): Locator {
		return this.page.locator('input[name="email"]');
	}

	// SMTP
	get inputSmtpServer(): Locator {
		return this.page.locator('input[name="smtpServer"]');
	}

	get inputSmtpUsername(): Locator {
		return this.page.locator('input[name="smtpUsername"]');
	}

	get inputSmtpPassword(): Locator {
		return this.page.locator('input[name="smtpPassword"]');
	}

	get inputSmtpSecure(): Locator {
		return this.page.locator('label >> text="Connect with SSL/TLS"').first();
	}

	// IMAP
	get inputImapServer(): Locator {
		return this.page.locator('input[name="imapServer"]');
	}

	get inputImapUsername(): Locator {
		return this.page.locator('input[name="imapUsername"]');
	}

	get inputImapPassword(): Locator {
		return this.page.locator('input[name="imapPassword"]');
	}

	get inputImapSecure(): Locator {
		return this.page.locator('label >> text="Connect with SSL/TLS"').last();
	}

	itemRow(name: string): Locator {
		return this.page.locator(`td >> text="${name}"`);
	}

	async deleteEmailInboxByName(name: string): Promise<void> {
		await this.itemRow(name).click();
		await this.btnDelete.click();
		await this.deleteModal.confirmDelete();
	}
}
