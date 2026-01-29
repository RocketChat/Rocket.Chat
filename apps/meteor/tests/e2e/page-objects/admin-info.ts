import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';

export class AdminInfo extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get adminPageContent(): Locator {
		return this.page.getByRole('main').filter({ has: this.page.getByRole('heading', { name: 'Workspace' }) });
	}
}
