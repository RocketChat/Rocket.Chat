import type { Locator, Page } from '@playwright/test';

export class ReportMessageModal {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get inputReportDescription(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Why do you want to report?' });
	}

	get btnSubmitReport(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Report!' });
	}

	get btnCancelReport(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Cancel' });
	}

	get reportDescriptionError(): Locator {
		return this.page.getByRole('dialog').getByText('You need to write something!');
	}

	get modalTitle(): Locator {
		return this.page.getByRole('dialog').getByText('Report this message?');
	}
}
