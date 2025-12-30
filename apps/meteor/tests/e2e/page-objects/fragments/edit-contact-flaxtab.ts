import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class OmnichannelEditContactFlaxTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Edit contact' }));
	}

	get inputEmail(): Locator {
		return this.root.locator('input[name="emails.0.address"]');
	}

	get inputPhone(): Locator {
		return this.root.locator('input[name="phones.0.phoneNumber"]');
	}

	get inputContactManager(): Locator {
		return this.root.locator('input[name=contactManager]');
	}

	get btnAddEmail(): Locator {
		return this.root.locator('role=button[name="Add email"]');
	}

	get btnAddPhone(): Locator {
		return this.root.locator('role=button[name="Add phone"]');
	}

	getErrorMessage(message: string): Locator {
		return this.root.locator(`role=alert >> text="${message}"`);
	}
}
