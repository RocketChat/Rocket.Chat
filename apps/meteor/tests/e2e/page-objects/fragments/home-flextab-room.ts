import type { Locator, Page } from '@playwright/test';

export class HomeFlextabRoom {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnEdit(): Locator {
		return this.page.locator('role=button[name="Edit"]');
	}

	get inputName(): Locator {
		return this.page.locator('//aside//label[contains(text(), "Name")]/..//input');
	}

	get inputTopic(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Topic")]/..//textarea');
	}

	get inputAnnouncement(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Announcement")]/..//textarea');
	}

	get inputDescription(): Locator {
		return this.page.locator('//main//aside//label[contains(text(), "Description")]/..//textarea');
	}

	get checkboxReadOnly(): Locator {
		return this.page.locator('label', {has: this.page.getByRole('checkbox', {name: 'Read Only'})});
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}
}
