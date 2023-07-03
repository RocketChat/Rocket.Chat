import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidenav } from './fragments';

export class OmnichannelTranscript {
	private readonly page: Page;

	readonly sidenav: OmnichannelSidenav;

	constructor(page: Page) {
		this.page = page;
		this.sidenav = new OmnichannelSidenav(page);
	}

	get checkboxPDF(): Locator {
		return this.page.locator('//input[@name="transcriptPDF"]//following::i[1]');
	}

	get exportedPDF(): Locator {
		return this.page.locator('//div[contains(text(),"PDF Transcript successfully generated")]');
	}

	get contactCenter(): Locator {
		return this.page.locator('//button[@data-tooltip="Contact Center"]');
	}

	get contactCenterChats(): Locator {
		return this.page.locator('//button[contains(.,"Chats")]');
	}

	get contactCenterSearch(): Locator {
		return this.page.locator('[placeholder="Search"]');
	}

	get firstRow(): Locator {
		return this.page.locator('//tr[1]//td[1]');
	}

	get viewFullConversation(): Locator {
		return this.page.locator('//button[@title="View full conversation"]/i');
	}

	get DownloadedPDF(): Locator {
		return this.page.locator('[data-qa-type="attachment-title-link"]').last();
	}
}
