import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';
import { CreateNewChannelModal, CreateNewDiscussionModal, CreateNewDMModal, CreateNewTeamModal } from '../create-new-modal';

export class Navbar {
	private readonly modals: {
		'Channel': CreateNewChannelModal;
		'Team': CreateNewTeamModal;
		'Discussion': CreateNewDiscussionModal;
		'Direct message': CreateNewDMModal;
	};

	constructor(private readonly root: Page) {
		this.modals = {
			'Channel': new CreateNewChannelModal(root),
			'Team': new CreateNewTeamModal(root),
			'Discussion': new CreateNewDiscussionModal(root),
			'Direct message': new CreateNewDMModal(root),
		};
	}

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

	get btnCreateNew(): Locator {
		return this.pagesGroup.getByRole('button', { name: 'Create new' });
	}

	get createNewMenu(): Locator {
		return this.root.getByRole('menu', { name: 'Create new' });
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

	createNewMenuItem(name: 'Direct message' | 'Discussion' | 'Channel' | 'Team' | 'Outbound message'): Locator {
		return this.createNewMenu.getByRole('menuitem', { name });
	}

	async openCreate(name: 'Direct message' | 'Discussion' | 'Channel' | 'Team'): Promise<void> {
		await this.btnCreateNew.click();
		await this.createNewMenuItem(name).click();
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

	async createNew(type: 'Channel' | 'Team' | 'Discussion' | 'Direct message', name: string): Promise<void> {
		await this.openCreate(type);
		await this.modals[type].inputName.fill(name);
		await this.modals[type].btnCreate.click();
	}

	async createNewChannel(name: string): Promise<void> {
		return this.createNew('Channel', name);
	}

	async createEncrypted(type: 'Channel' | 'Team', name: string): Promise<void> {
		await this.openCreate(type);
		await this.modals[type].inputName.fill(name);
		await this.modals[type].advancedSettingsAccordion.click();
		await this.modals[type].checkboxEncrypted.click();
		await this.modals[type].btnCreate.click();
	}

	async createEncryptedChannel(name: string): Promise<void> {
		await this.createEncrypted('Channel', name);
	}
}
