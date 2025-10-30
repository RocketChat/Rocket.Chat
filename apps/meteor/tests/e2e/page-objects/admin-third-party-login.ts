import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { ConfirmDeleteModal } from './fragments/modal';

export class AdminThirdPartyLogin extends Admin {
	readonly deleteModal: ConfirmDeleteModal;

	constructor(page: Page) {
		super(page);
		this.deleteModal = new ConfirmDeleteModal(page.getByRole('dialog'));
	}

	get btnNewApplication(): Locator {
		return this.page.getByRole('button', { name: 'New Application', exact: true });
	}

	get inputRedirectURI(): Locator {
		return this.page.getByRole('textbox', { name: 'Redirect URI' });
	}

	get inputApplicationName(): Locator {
		return this.page.getByRole('textbox', { name: 'Application Name' });
	}

	get inputClientId(): Locator {
		return this.page.getByRole('textbox', { name: 'Client ID' });
	}

	get inputClientSecret(): Locator {
		return this.page.getByRole('textbox', { name: 'Client Secret' });
	}

	get inputAuthUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Authorization URL' });
	}

	get inputTokenUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Access Token URL' });
	}

	getThirdPartyAppByName(name: string): Locator {
		return this.page.getByRole('table', { name: 'Third-party applications table' }).locator('tr', { hasText: name });
	}

	async deleteThirdPartyAppByName(name: string) {
		await this.getThirdPartyAppByName(name).click();
		await this.page.getByRole('button', { name: 'Delete', exact: true }).click();
		await this.deleteModal.confirmDelete();
	}
}
