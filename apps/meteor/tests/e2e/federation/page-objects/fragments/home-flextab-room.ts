import type { Locator, Page } from '@playwright/test';

export class FederationHomeFlextabRoom {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnEdit(): Locator {
		return this.page.locator('role=button[name="Edit"]');
	}

	get btnLeave(): Locator {
		return this.page.locator('role=button[name="Leave"]');
	}

	get btnDelete(): Locator {
		return this.page.locator('role=button[name="Delete"]');
	}

	get inputName(): Locator {
		return this.page.locator('//dialog//label[contains(text(), "Name")]/..//input');
	}

	get inputTopic(): Locator {
		return this.page.locator('//main//dialog//label[contains(text(), "Topic")]/..//textarea');
	}

	get inputAnnouncement(): Locator {
		return this.page.locator('//main//dialog//label[contains(text(), "Announcement")]/..//textarea');
	}

	get inputDescription(): Locator {
		return this.page.locator('//main//dialog//label[contains(text(), "Description")]/..//textarea');
	}

	get checkboxReadOnly(): Locator {
		return this.page.locator('text=Read OnlyOnly authorized users can write new messages >> i');
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}

	get btnModalConfirm(): Locator {
		return this.page.locator('#modal-root dialog .rcx-modal__inner .rcx-modal__footer .rcx-button--danger');
	}
}
