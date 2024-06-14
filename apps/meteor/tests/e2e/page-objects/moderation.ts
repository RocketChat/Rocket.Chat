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

	findLastReportedMessage(quotedMessage: string): Locator {
		return this.page.locator(`text=${quotedMessage}`).first();
	}

	findRowByName(name: string): Locator {
		return this.page.locator(`tr:has-text("${name}")`);
	}
}
