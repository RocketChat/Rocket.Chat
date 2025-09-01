import type { Locator, Page } from '@playwright/test';

import { HomeSidenav } from './fragments/home-sidenav';

export class OmnichannelRoomInfo {
	private readonly page: Page;

	private readonly homeSidenav: HomeSidenav;

	constructor(page: Page) {
		this.page = page;
		this.homeSidenav = new HomeSidenav(page);
	}

	get dialogRoomInfo(): Locator {
		return this.page.getByRole('dialog', { name: 'Room Information' });
	}

	get btnEditRoomInfo(): Locator {
		return this.dialogRoomInfo.getByRole('button', { name: 'Edit' });
	}

	get dialogEditRoom(): Locator {
		return this.page.getByRole('dialog', { name: 'Edit Room' });
	}

	get inputTopic(): Locator {
		return this.dialogEditRoom.getByRole('textbox', { name: 'Topic' });
	}

	get btnSaveEditRoom(): Locator {
		return this.dialogEditRoom.getByRole('button', { name: 'Save' });
	}

	getInfo(value: string): Locator {
		return this.page.locator(`span >> text="${value}"`);
	}

	getLabel(label: string): Locator {
		return this.page.locator(`div >> text="${label}"`);
	}

	getInfoByLabel(label: string): Locator {
		return this.dialogRoomInfo.getByLabel(label);
	}

	get inputSLAPolicy(): Locator {
		return this.dialogEditRoom.getByRole('button', { name: 'SLA Policy' });
	}

	async selectSLA(name: string): Promise<void> {
		await this.inputSLAPolicy.click();
		return this.page.getByRole('option', { name, exact: true }).click();
	}

	getBadgeIndicator(name: string, title: string): Locator {
		return this.homeSidenav.getSidebarItemByName(name).getByTitle(title);
	}
}
