import type { Locator, Page } from '@playwright/test';

export class Navbar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get navbar(): Locator {
		return this.page.getByRole('navigation', { name: 'header' });
	}

	get pagesToolbar(): Locator {
		return this.navbar.getByRole('toolbar', { name: 'Pages' });
	}

	get homeButton(): Locator {
		return this.pagesToolbar.getByRole('button', { name: 'Home' });
	}
}
