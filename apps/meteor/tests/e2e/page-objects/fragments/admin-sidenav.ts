import type { Locator, Page } from '@playwright/test';

export class AdminSidenav {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get linkInfo(): Locator {
		return this.page.locator('.flex-nav [href="/admin/info"]');
	}

	get linkUsers(): Locator {
		return this.page.locator('.flex-nav [href="/admin/users"]');
	}

	get linkRooms(): Locator {
		return this.page.locator('.flex-nav [href="/admin/rooms"]');
	}

	get linkSettings(): Locator {
		return this.page.locator('.flex-nav [href="/admin/settings"]');
	}
}
