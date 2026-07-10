import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { goToRouteAndWait } from '../utils/goToRouteAndWait';

export class AdminSettings extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get inputSearchSettings(): Locator {
		return this.page.locator('input[type=search]');
	}

	get adminPageContent(): Locator {
		return this.page.getByRole('main').filter({ has: this.page.getByRole('heading', { name: 'Settings' }) });
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

	async goto(): Promise<void> {
		await goToRouteAndWait(this.page, '/admin/settings', this.inputSearchSettings);
	}

	async gotoGeneral(): Promise<void> {
		await goToRouteAndWait(this.page, '/admin/settings/General', this.inputSiteURL);
	}

	async gotoLayout(): Promise<void> {
		await goToRouteAndWait(this.page, '/admin/settings/Layout', this.getAccordionBtnByName('Custom CSS'));
	}
}
