import type { Locator, Page } from '@playwright/test';

export class AdminEmailInboxes {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnNewEmailInbox(): Locator {
		return this.page.locator('//button >> text="New Email Inbox"');
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
		return this.page.locator('label >> text="Connect with SSL/TLS" >> nth=0 >> i');
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
		return this.page.locator('label >> text="Connect with SSL/TLS" >> nth=1 >> i');
	}

	get btnSave(): Locator {
		return this.page.locator('button >> text=Save');
	}

	get btnDelete(): Locator {
		return this.page.locator('button >> text=Delete');
	}

	findEmailInbox(email: string): Locator {
		return this.page.locator(`td >> text=${email}`);
	}
}
