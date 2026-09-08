import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';

export class AdminThirdPartyLogin extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get btnNewApplication(): Locator {
		return this.page.getByRole('button', { name: 'New application', exact: true });
	}

	get inputRedirectURI(): Locator {
		return this.page.getByRole('textbox', { name: 'Redirect URI' });
	}

	get inputApplicationName(): Locator {
		return this.page.getByRole('textbox', { name: 'Application name' });
	}

	get inputClientId(): Locator {
		return this.page.getByRole('textbox', { name: 'Client ID' });
	}

	get inputClientSecret(): Locator {
		return this.page.getByRole('textbox', { name: 'Client secret' });
	}

	get inputAuthUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Authorization URL' });
	}

	get inputTokenUrl(): Locator {
		return this.page.getByRole('textbox', { name: 'Access token URL' });
	}

	getThirdPartyAppByName(name: string): Locator {
		return this.page.getByRole('table', { name: 'Third-party applications table' }).locator('tr', { hasText: name });
	}

	async deleteThirdPartyAppByName(name: string) {
		await this.getThirdPartyAppByName(name).click();
		await this.btnDelete.click();
		await this.deleteModal.confirmDelete();
	}
}
