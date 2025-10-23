import type { Locator, Page } from '@playwright/test';

import { HomeContent, HomeFlextab, HomeSidenav } from './fragments';
import { RoomToolbar } from './fragments/toolbar';
import { HomeChannel } from './home-channel';

/**
 * TODO: HomeTeam shouldn't exist since the rooms are the same
 */
export class HomeTeam extends HomeChannel {
	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly tabs: HomeFlextab;

	readonly roomToolbar: RoomToolbar;

	constructor(page: Page) {
		super(page);
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.tabs = new HomeFlextab(page);
		this.roomToolbar = new RoomToolbar(page);
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
