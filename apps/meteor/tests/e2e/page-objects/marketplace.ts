import type { Locator, Page } from '@playwright/test';

export class Marketplace {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnUploadPrivateApp(): Locator {
		return this.page.locator('role=button[name="Upload private app"]');
	}

	get btnInstallPrivateApp(): Locator {
		return this.page.locator('role=button[name="Install"]');
	}

	get btnUploadPrivateAppFile(): Locator {
		return this.page.locator('role=button[name="Browse Files"]');
	}

	get appStatusTag(): Locator {
		return this.page.locator('[data-qa-type="app-status-tag"]');
	}

	get confirmAppUploadModalTitle(): Locator {
		return this.page.locator('[data-qa-id="confirm-app-upload-modal-title"]');
	}

	get btnConfirmAppUploadModal(): Locator {
		return this.page.locator('role=button[name="Upload anyway"]');
	}

	get lastAppRow(): Locator {
		return this.page.locator('[data-qa-type="app-row"]').last();
	}

	get appMenu(): Locator {
		return this.page.getByTitle('More options');
	}

	get btnEnableApp(): Locator {
		return this.page.getByRole('menuitem', { name: 'Enable' });
	}

	get btnDisableApp(): Locator {
		return this.page.getByRole('menuitem', { name: 'Disable' });
	}

	get btnConfirmAppUpdate(): Locator {
		return this.page.locator('role=button[name="Yes"]');
	}
}
