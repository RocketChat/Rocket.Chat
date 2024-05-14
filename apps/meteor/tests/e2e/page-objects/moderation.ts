import type { Locator, Page } from '@playwright/test';

export class Moderation {
  private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

  get reportedMessagesTab(): Locator {
		return this.page.locator('button:has-text("Reported messages")');
	}

	get reportMsgButton(): Locator {
		return this.page.locator('role=menuitem[name="Report"]');
	}

	get reportMessageModal(): Locator {
		return this.page.locator('dialog h2:has-text("Report this message?")');
	}

	get reportMessageReasonText(): Locator {
		return this.page.locator('textarea[name="description"]');
	}

	get reportMessageReasonSubmit(): Locator {
		return this.page.locator('button[type="submit"]');
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}

	findRowByName(name: string): Locator {
		return this.page.locator(`tr:has-text("${name}")`);
	}
};
