import type { Locator, Page } from '@playwright/test';

import { FederationAdminFlextab } from './fragments/admin-flextab';

export class FederationAdmin {
	private readonly page: Page;

	readonly tabs: FederationAdminFlextab;

	constructor(page: Page) {
		this.page = page;
		this.tabs = new FederationAdminFlextab(page);
	}

	get inputSearchRooms(): Locator {
		return this.page.locator('input[placeholder ="Search Rooms"]');
	}

	get inputSearchUsers(): Locator {
		return this.page.locator('input[placeholder="Search Users"]');
	}

	get inputSearchSettings(): Locator {
		return this.page.locator('input[type=search]');
	}
}
