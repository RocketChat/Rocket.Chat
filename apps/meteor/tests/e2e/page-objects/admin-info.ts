import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { goToRouteAndWait } from '../utils/goToRouteAndWait';

export class AdminInfo extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get adminPageContent(): Locator {
		return this.page.getByRole('main').filter({ has: this.page.getByRole('heading', { name: 'Workspace' }) });
	}

	async goto(): Promise<void> {
		await goToRouteAndWait(this.page, '/admin/info', this.adminPageContent);
	}
}
