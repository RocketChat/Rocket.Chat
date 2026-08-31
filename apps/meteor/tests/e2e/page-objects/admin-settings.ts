import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';

export class AdminSettings extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get inputSearchSettings(): Locator {
		return this.page.locator('input[type=search]');
	}

	get inputSiteURL(): Locator {
		return this.page.getByRole('textbox', { name: 'Site URL' });
	}

	get btnResetSiteURL(): Locator {
		return this.page.locator('//label[@title="Site_Url"]//following-sibling::button');
	}

	get btnAssetsSettings(): Locator {
		return this.page.locator('[data-qa-id="Assets"] >> role=link[name="Open"]');
	}

	get btnDeleteAssetsLogo(): Locator {
		return this.page.locator('//label[@title="Assets_logo"]/following-sibling::span >> role=button[name="Delete"]');
	}

	get inputAssetsLogo(): Locator {
		return this.page.locator('//label[@title="Assets_logo"]/following-sibling::span >> input[type="file"]');
	}

	get btnFullScreen(): Locator {
		return this.page.getByRole('button', { name: 'Full Screen', exact: true });
	}

	get btnExitFullScreen(): Locator {
		return this.page.getByRole('button', { name: 'Exit Full Screen', exact: true });
	}

	get btnSaveChanges(): Locator {
		return this.page.getByRole('button', { name: 'Save changes' });
	}
}
