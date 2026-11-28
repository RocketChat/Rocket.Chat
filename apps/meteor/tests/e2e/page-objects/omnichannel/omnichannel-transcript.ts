import type { Locator, Page } from '@playwright/test';

export class OmnichannelTranscript {
	constructor(private readonly page: Page) {}

	get contactCenterChats(): Locator {
		return this.page.locator('//button[contains(.,"Chats")]');
	}

	get contactCenterSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	get firstRow(): Locator {
		return this.page.locator('//tr[1]//td[1]');
	}

	get btnOpenChat(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Open chat', exact: true });
	}
}
