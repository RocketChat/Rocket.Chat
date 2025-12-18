import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';

export class OmnichannelContactReviewModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Review contact' }));
	}

	get btnSeeConflicts(): Locator {
		return this.root.getByRole('button', { name: 'See conflicts', exact: true });
	}

	getFieldByName(name: string): Locator {
		return this.root.getByLabel(name, { exact: true });
	}

	findOption(name: string): Locator {
		return this.root.getByRole('option', { name, exact: true });
	}
}
