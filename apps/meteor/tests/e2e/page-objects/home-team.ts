import type { Locator, Page } from '@playwright/test';

import { HomeContent, HomeFlextab, HomeSidenav, Sidebar, Navbar, CreateRoomModal } from './fragments';

export class HomeTeam {
	private readonly page: Page;

	readonly content: HomeContent;

	readonly sidenav: HomeSidenav;

	readonly sidebar: Sidebar;

	readonly navbar: Navbar;

	readonly tabs: HomeFlextab;

	readonly createRoomModal: CreateRoomModal;

	constructor(page: Page) {
		this.page = page;
		this.content = new HomeContent(page);
		this.sidenav = new HomeSidenav(page);
		this.sidebar = new Sidebar(page);
		this.navbar = new Navbar(page);
		this.tabs = new HomeFlextab(page);
		this.createRoomModal = new CreateRoomModal(page);
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
