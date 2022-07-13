import { Page } from '@playwright/test';

import { AdminFlextab } from './fragments';

export class Admin {
	readonly tabs: AdminFlextab;

	constructor(page: Page) {
		this.tabs = new AdminFlextab(page);
	}
}
