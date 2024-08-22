import type { Locator, Page } from '@playwright/test';

import { HomeContent, HomeFlextab, HomeSidenav } from './fragments';

export class HomeTeam {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
	}

	get inputTeamName(): Locator {
		return this.page.locator('role=textbox[name="Name"]');
	}

	async addMember(memberName: string): Promise<void> {
		await this.page.locator('role=textbox[name="Members"]').type(memberName, { delay: 100 });
		await this.page.locator(`.rcx-option__content:has-text("${memberName}")`).click();
	}

	get btnTeamCreate(): Locator {
		return this.page.locator('role=dialog >> role=group >> role=button[name=Create]');
	}

	get textPrivate(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Private' }) });
	}

	get textReadOnly(): Locator {
		return this.page.locator('label', { has: this.page.getByRole('checkbox', { name: 'Read-only' }) });
	}
}
