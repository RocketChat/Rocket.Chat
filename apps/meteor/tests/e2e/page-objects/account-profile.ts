import { Page } from '@playwright/test';

import { AccountSidebar } from './fragments';

export class AccountProfile {
	private readonly page: Page;

	readonly sidebar: AccountSidebar;

	constructor(page: Page) {
		this.page = page;

		this.sidebar = new AccountSidebar(page);
	}
}
