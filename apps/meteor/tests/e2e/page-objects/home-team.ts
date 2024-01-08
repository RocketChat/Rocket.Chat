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
		return this.page.locator('.rcx-field-group__item:nth-child(1) input');
	}

	async addMember(memberName: string): Promise<void> {
		await this.page.locator('.rcx-field-group__item:nth-child(7) input').type(memberName, { delay: 100 });
		await this.page.locator(`.rcx-option__content:has-text("${memberName}")`).click();
	}

	get btnTeamCreate(): Locator {
		return this.page.locator('role=dialog >> role=group >> role=button[name=Create]');
	}

	get textPrivate(): Locator {
		return this.page.locator('role=dialog[name="Create Team"] >> label >> text="Private"');
	}

	get textReadOnly(): Locator {
		return this.page.locator('role=dialog[name="Create Team"] >> label >> text="Read Only"');
	}
}
