import type { Locator, Page } from '@playwright/test';

export class OmnichannelContactReviewModal {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnSeeConflicts(): Locator {
		return this.page.getByRole('button', { name: 'See conflicts', exact: true });
	}

	get btnSave(): Locator {
		return this.page.getByRole('button', { name: 'Save', exact: true });
	}

	getFieldByName(name: string): Locator {
		return this.page.getByLabel(name, { exact: true });
	}

	findOption(name: string): Locator {
		return this.page.getByRole('option', { name, exact: true });
	}
}
