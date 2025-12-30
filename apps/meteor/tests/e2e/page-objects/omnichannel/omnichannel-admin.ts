import type { Locator, Page } from '@playwright/test';

import { OmnichannelSidebar, ToastMessages } from '../fragments';
import { ConfirmDeleteModal } from '../fragments/modals';

export abstract class OmnichannelAdmin {
	protected readonly page: Page;

	protected readonly toastMessage: ToastMessages;

	readonly sidebar: OmnichannelSidebar;

	readonly deleteModal: ConfirmDeleteModal;

	constructor(page: Page) {
		this.page = page;
		this.sidebar = new OmnichannelSidebar(page);
		this.toastMessage = new ToastMessages(page);
		this.deleteModal = new ConfirmDeleteModal(page.getByRole('dialog', { name: 'Are you sure?' }));
	}

	get inputSearch() {
		return this.page.getByRole('main').getByRole('textbox', { name: 'Search' });
	}

	get btnSaveChanges(): Locator {
		return this.page.getByRole('button', { name: 'Save changes' });
	}

	createByName(name: string) {
		return this.page.locator(`role=button[name="Create ${name}"]`);
	}

	async search(text: string) {
		await this.inputSearch.fill(text);
	}

	async clearSearch() {
		await this.inputSearch.fill('');
		await this.page.waitForTimeout(500);
	}

	get btnBack(): Locator {
		return this.page.locator('role=button[name="Back"]');
	}
}
