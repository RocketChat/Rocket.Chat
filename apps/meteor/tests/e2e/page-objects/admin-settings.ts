import type { Locator, Page } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';

/**
 * A single settings section, e.g. `/admin/settings/Omnichannel`. Its `title` is the section heading, so it gets its ready state from `Admin` like any other page.
 */
export abstract class AdminSettingsSection extends Admin {
	protected abstract override readonly route: `${AdminSectionsHref.settings}/${string}`;
}

/** The settings index at `/admin/settings`. Individual sections are `AdminSettingsSection`s. */
export class AdminSettings extends Admin {
	constructor(page: Page) {
		super(page);
	}

	get inputSearchSettings(): Locator {
		return this.page.locator('input[type=search]');
	}

	protected readonly route = AdminSectionsHref.settings;

	protected readonly title = 'Settings';

	override async waitForReady(): Promise<void> {
		await this.inputSearchSettings.waitFor({ state: 'visible' });
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

	getSectionHeading(section: string): Locator {
		return this.page.getByRole('main').getByRole('heading', { level: 1, name: section, exact: true });
	}

	/**
	 * Opens a settings section, e.g. `Message` for `/admin/settings/Message`.
	 *
	 * @param section id of the section, which doubles as its heading
	 * @param until element to wait for, when the section heading is not a strong enough ready signal
	 */
	async gotoSection(section: string, until: Locator = this.getSectionHeading(section)): Promise<void> {
		await this.navigateTo(`${AdminSectionsHref.settings}/${section}`, until);
	}

	async gotoGeneral(): Promise<void> {
		await this.gotoSection('General', this.inputSiteURL);
	}

	async gotoLayout(): Promise<void> {
		await this.gotoSection('Layout', this.getAccordionBtnByName('Custom CSS'));
	}
}
