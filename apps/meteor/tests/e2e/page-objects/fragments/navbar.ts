import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class Navbar {
	constructor(private readonly root: Page) {}

	get btnVoiceAndOmnichannel(): Locator {
		return this.root.getByRole('button', { name: 'Voice and omnichannel' });
	}

	get groupHistoryNavigation(): Locator {
		return this.root.getByRole('group', { name: 'History navigation' });
	}

	get pagesGroup(): Locator {
		return this.root.getByRole('group', { name: 'Pages and actions' });
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

	get btnDisplay(): Locator {
		return this.pagesGroup.getByRole('button', { name: 'Display' });
	}

	get menuDisplay(): Locator {
		return this.root.getByRole('menu', { name: 'Display' });
	}

	get navbarSearchSection(): Locator {
		return this.root.getByRole('search');
	}

	get searchInput(): Locator {
		return this.navbarSearchSection.getByRole('combobox');
	}

	get searchList(): Locator {
		return this.navbarSearchSection.getByRole('listbox', { name: 'Channels' });
	}

	get workspaceGroup(): Locator {
		return this.root.getByRole('group', { name: 'Workspace and user preferences' });
	}

	get manageWorkspaceButton(): Locator {
		return this.workspaceGroup.getByRole('button', { name: 'Manage' });
	}

	get btnUserMenu(): Locator {
		return this.workspaceGroup.getByRole('button', { name: 'User menu' });
	}

	get userMenu(): Locator {
		return this.root.getByRole('menu', { name: 'User menu' });
	}

	get btnLogout(): Locator {
		return this.userMenu.getByRole('menuitemcheckbox', { name: 'Logout' });
	}

	async logout(): Promise<void> {
		await this.btnUserMenu.click();
		return this.btnLogout.click();
	}

	btnSidebarToggler(closeSidebar?: boolean): Locator {
		return this.root.getByRole('button', { name: closeSidebar ? 'Close sidebar' : 'Open sidebar' });
	}

	async openAdminPanel(): Promise<void> {
		await this.manageWorkspaceButton.click();
		await this.root.getByRole('menuitem', { name: 'Workspace' }).click();
		await this.root.waitForURL(/\/admin/);
	}

	async typeSearch(name: string): Promise<void> {
		return this.searchInput.fill(name);
	}

	async waitForChannel(): Promise<void> {
		await this.root.locator('role=main').waitFor();
		await this.root.locator('role=main >> role=heading[level=1]').waitFor();
		const messageList = this.root.getByRole('main').getByRole('list', { name: 'Message list', exact: true });
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

	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		await this.btnDisplay.click();
		await this.menuDisplay.getByRole('menuitemcheckbox', { name: mode }).click();
		await this.root.keyboard.press('Escape');
	}
}
