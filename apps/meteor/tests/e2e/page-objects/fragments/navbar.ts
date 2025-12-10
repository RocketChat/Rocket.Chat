import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';
import { CreateNewChannelModal, CreateNewDiscussionModal, CreateNewDMModal, CreateNewTeamModal } from '../create-new-modal';
import { EditStatusModal } from './edit-status-modal';

export class Navbar {
	private readonly modals: {
		'Channel': CreateNewChannelModal;
		'Team': CreateNewTeamModal;
		'Discussion': CreateNewDiscussionModal;
		'Direct message': CreateNewDMModal;
		'editStatus': EditStatusModal;
	};

	constructor(private readonly root: Page) {
		this.modals = {
			'Channel': new CreateNewChannelModal(root),
			'Team': new CreateNewTeamModal(root),
			'Discussion': new CreateNewDiscussionModal(root),
			'Direct message': new CreateNewDMModal(root),
			'editStatus': new EditStatusModal(root),
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

	get btnHome(): Locator {
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

	get btnManageWorkspace(): Locator {
		return this.workspaceGroup.getByRole('button', { name: 'Manage' });
	}

	async openManageMenuItem(name: 'Workspace' | 'Omnichannel'): Promise<void> {
		await this.btnManageWorkspace.click();
		await this.root.getByRole('menu', { name: 'Manage' }).getByRole('menuitem', { name }).click();
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

	getUserProfileMenuOption(name: string): Locator {
		return this.userMenu.getByRole('menuitemcheckbox', { name });
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
		await this.btnManageWorkspace.click();
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
		return this.searchList.getByRole('option', { name }).filter({ has: this.root.getByText(name, { exact: true }) });
	}

	getSearchItemBadge(name: string): Locator {
		return this.getSearchRoomByName(name).getByRole('status', { name: 'unread' });
	}

	async openChat(name: string): Promise<void> {
		await this.typeSearch(name);
		await this.getSearchRoomByName(name).waitFor();
		await this.getSearchRoomByName(name).click();
		await this.waitForChannel();
	}

	async setDisplayMode(mode: 'Extended' | 'Medium' | 'Condensed'): Promise<void> {
		await this.btnDisplay.click();
		await this.menuDisplay.getByRole('menuitemcheckbox', { name: mode }).click();
		await this.root.keyboard.press('Escape');
	}

	async createNew(
		type: 'Channel' | 'Team',
		name: string,
		options?: { private?: boolean; encrypted?: boolean; readOnly?: boolean; federated?: boolean },
	): Promise<void> {
		await this.openCreate(type);
		await this.modals[type].inputName.fill(name);

		if (options?.private === false) {
			await this.modals[type].checkboxPrivate.click();
		}

		if (options && ('encrypted' in options || 'readOnly' in options || 'federated' in options)) {
			await this.modals[type].advancedSettingsAccordion.click();
		}
		if (options?.encrypted) {
			await this.modals[type].checkboxEncrypted.click();
		}
		if (options?.readOnly) {
			await this.modals[type].checkboxReadOnly.click();
		}
		if (options?.federated) {
			await this.modals[type].checkboxFederated.click();
		}

		await this.modals[type].btnCreate.click();
	}

	async createNewDM(username: string): Promise<void> {
		await this.openCreate('Direct message');
		await this.modals['Direct message'].dmListbox.click();
		await this.modals['Direct message'].dmListbox.pressSequentially(username);
		await this.root.waitForTimeout(600);
		await this.root.keyboard.press('Enter');

		await this.modals['Direct message'].btnCreate.click();
	}

	async createNewDiscussion(parentRoom: string, name: string, message?: string): Promise<void> {
		await this.openCreate('Discussion');
		await this.modals.Discussion.inputParentRoom.click();
		await this.modals.Discussion.inputParentRoom.pressSequentially(parentRoom);
		await this.modals.Discussion.getParentRoomListItem(parentRoom).click();
		await this.modals.Discussion.inputName.fill(name);
		message && (await this.modals.Discussion.inputMessage.fill(message));
		await this.modals.Discussion.btnCreate.click();
	}

	async createEncryptedChannel(name: string): Promise<void> {
		await this.createNew('Channel', name, { encrypted: true });
	}

	async changeUserStatus(status: 'online' | 'away' | 'busy' | 'invisible' | 'offline' | string): Promise<void> {
		await this.btnUserMenu.click();
		await this.getUserProfileMenuOption(status).click();
	}

	async changeUserCustomStatus(text: string): Promise<void> {
		await this.btnUserMenu.click();
		await this.getUserProfileMenuOption('Custom Status').click();
		await this.modals.editStatus.changeStatusMessage(text);
	}
}
