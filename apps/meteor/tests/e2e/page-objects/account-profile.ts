import { Page } from '@playwright/test';

import { AccountSidebar } from './slices';

export class AccountProfile {
	private readonly page: Page;

	readonly sidebar: AccountSidebar;

	constructor(page: Page) {
		this.page = page;

		this.sidebar = new AccountSidebar(page);
	}
}
