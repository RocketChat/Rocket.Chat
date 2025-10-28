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

	get workspaceGroup(): Locator {
		return this.navbar.getByRole('group', { name: 'Workspace and user preferences' });
	}

	get manageWorkspaceButton(): Locator {
		return this.workspaceGroup.getByRole('button', { name: 'Manage' });
	}

	btnSidebarToggler(closeSidebar?: boolean): Locator {
		return this.navbar.getByRole('button', { name: closeSidebar ? 'Close sidebar' : 'Open sidebar' });
	}

	async openAdminPanel(): Promise<void> {
		await this.manageWorkspaceButton.click();
		await this.page.getByRole('menuitem', { name: 'Workspace' }).click();
		await this.page.waitForURL(/\/admin/);
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
		return this.searchList.getByRole('option', { name, exact: true });
	}

	async openChat(name: string): Promise<void> {
		await this.typeSearch(name);
		await this.getSearchRoomByName(name).click();
		await this.waitForChannel();
	}
}
