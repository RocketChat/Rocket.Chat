import type { Locator } from '@playwright/test';

import { RoutedPage } from './routed-page';

export class Marketplace extends RoutedPage {
	protected readonly route = '/marketplace/private';

	async waitForReady(): Promise<void> {
		await this.btnUploadPrivateApp.waitFor({ state: 'visible' });
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
