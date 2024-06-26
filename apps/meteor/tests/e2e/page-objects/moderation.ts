import type { Locator, Page } from '@playwright/test';

export class Moderation {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get reportMsgButton(): Locator {
		return this.page.locator('role=menuitem[name="Report"]');
	}

	get reportMessageReasonText(): Locator {
		return this.page.locator('textarea[name="description"]');
	}

	get reportMessageReasonSubmit(): Locator {
		return this.page.locator('button[type="submit"]');
	}

	get contextualBar(): Locator {
		return this.page.locator('div[role="dialog"].rcx-vertical-bar');
	}

	get btnDismissAllReports(): Locator {
		return this.contextualBar.locator('button:has-text("Dismiss all reports")');
	}

	get btnDeleteAllReportedMessages(): Locator {
		return this.contextualBar.locator('button:has-text("Delete all messages")');
	}

	findReportedMessage(message: string): Locator {
		return this.page.locator(`div[data-qa-id="reported-message"] div:has-text("${message}")`).first();
	}

	get dismissReportsButton(): Locator {
		return this.page.locator('role=button[title="Dismiss reports"]');
	}

	deleteReportedMessageButton(message: string): Locator {
		return this.findReportedMessage(message).locator('role=button[title="Delete message"]');
	}

	findLastReportedMessage(message: string): Locator {
		return this.page.locator(`text=${message}`).first();
	}

	findRowByName(name: string): Locator {
		return this.page.locator(`tr:has-text("${name}")`);
	}
}
