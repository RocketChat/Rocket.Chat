import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class Navbar {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get navbar(): Locator {
		return this.page.getByRole('navigation', { name: 'header' });
	}

	get btnSidebarToggler(): Locator {
		return this.navbar.getByRole('button', { name: 'Open sidebar' });
	}

	get btnVoiceAndOmnichannel(): Locator {
		return this.navbar.getByRole('button', { name: 'Voice and omnichannel' });
	}

	get groupHistoryNavigation(): Locator {
		return this.navbar.getByRole('group', { name: 'History navigation' });
	}

	get pagesGroup(): Locator {
		return this.navbar.getByRole('group', { name: 'Pages and actions' });
	}

	get homeButton(): Locator {
		return this.pagesGroup.getByRole('button', { name: 'Home' });
	}

	get btnDirectory(): Locator {
		return this.pagesGroup.getByRole('button', { name: 'Directory' });
	}

	get btnMenuPages(): Locator {
		return this.pagesGroup.getByRole('button', { name: 'Pages' });
	}

	get navbarSearchSection(): Locator {
		return this.navbar.getByRole('search');
	}

	get searchInput(): Locator {
		return this.navbarSearchSection.getByRole('combobox');
	}

	get searchList(): Locator {
		return this.navbarSearchSection.getByRole('listbox', { name: 'Channels' });
	}

	async typeSearch(name: string): Promise<void> {
		return this.searchInput.fill(name);
	}

	async waitForChannel(): Promise<void> {
		await this.page.locator('role=main').waitFor();
		await this.page.locator('role=main >> role=heading[level=1]').waitFor();
		const messageList = this.page.getByRole('main').getByRole('list', { name: 'Message list', exact: true });
		await messageList.waitFor();

		await expect(messageList).not.toHaveAttribute('aria-busy', 'true');
	}

	getSearchRoomByName(name: string): Locator {
		return this.searchList.getByRole('option', { name });
	}

	async openChat(name: string): Promise<void> {
		await this.typeSearch(name);
		await this.getSearchRoomByName(name).click();
		await this.waitForChannel();
	}

	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		await this.pagesGroup.getByRole('button', { name: 'Display', exact: true }).click();
		await this.pagesGroup.getByRole('menuitemcheckbox', { name: mode }).click();
		await this.pagesGroup.click();
	}
}
