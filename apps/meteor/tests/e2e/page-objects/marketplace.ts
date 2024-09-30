import type { Locator, Page } from '@playwright/test';

export class Marketplace {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get btnUploadPrivateApp(): Locator {
		return this.page.locator('[data-qa-id="upload-private-app"]');
	}

	get btnInstallPrivateApp(): Locator {
		return this.page.locator('[data-qa-id="install-private-app"]');
	}

	get btnUploadPrivateAppFile(): Locator {
		return this.page.locator('[data-qa-id="upload-private-app-file"]');
	}

	get appStatusTag(): Locator {
		return this.page.locator('[data-qa-type="app-status-tag"]');
	}

	get confirmAppUploadModalTitle(): Locator {
		return this.page.locator('[data-qa-id="confirm-app-upload-modal-title"]');
	}

	get confirmAppUploadModalButton(): Locator {
		return this.page.locator('[data-qa-id="confirm-app-upload-modal-button"]');
	}

	get lastAppRow(): Locator {
		return this.page.locator('[data-qa-type="app-row"]').last();
	}

	get appMenu(): Locator {
		return this.page.getByTitle('More options');
	}

	get enableAppAction(): Locator {
		return this.page.getByRole('menuitem', { name: 'Enable' });
	}
}
