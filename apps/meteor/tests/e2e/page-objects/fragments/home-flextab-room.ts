import type { Locator, Page } from '@playwright/test';

export class HomeFlextabRoom {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnEdit(): Locator {
		return this.page.locator('role=button[name="Edit"]');
	}

	get btnDelete(): Locator {
		return this.page.locator('role=button[name="Delete"]');
	}

	get inputName(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Name' });
	}

	get inputTopic(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Topic' });
	}

	get inputAnnouncement(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Announcement' });
	}

	get inputDescription(): Locator {
		return this.page.getByRole('dialog').getByRole('textbox', { name: 'Description' });
	}

	get checkboxReadOnly(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Read-only' }) });
	}

	get btnSave(): Locator {
		return this.page.locator('role=button[name="Save"]');
	}

	get pruneAccordion(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Prune' });
	}

	get checkboxPruneMessages(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Automatically prune old messages' }) });
	}

	get alertRetentionPolicy(): Locator {
		return this.page.getByRole('alert', { name: 'Unpinned messages older than 30 days are automatically pruned here' });
	}
}
