import type { Page } from '@playwright/test';

export class HomeFlextabRoom {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnEdit() {
		return this.page.locator('//aside//button[contains(text(), "Edit")]');
	}

	get inputName() {
		return this.page.locator('//aside//label[contains(text(), "Name")]/..//input');
	}

	get inputTopic() {
		return this.page.locator('//main//aside//label[contains(text(), "Topic")]/..//textarea');
	}

	get inputAnnouncement() {
		return this.page.locator('//main//aside//label[contains(text(), "Announcement")]/..//textarea');
	}

	get inputDescription() {
		return this.page.locator('//main//aside//label[contains(text(), "Description")]/..//textarea');
	}

	get btnSave() {
		return this.page.locator('//aside//button[contains(text(), "Save")]');
	}
}
