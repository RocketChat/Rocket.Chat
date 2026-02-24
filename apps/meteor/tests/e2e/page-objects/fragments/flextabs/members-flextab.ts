import type { Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Listbox } from '../listbox';
import { MenuMore } from '../menu';
import { ConfirmRemoveModal } from '../modals';
import { Modal } from '../modals/modal';

export class ConfirmMuteModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Are you sure' }));
	}

	private get btnMute() {
		return this.root.getByRole('button', { name: 'Yes, mute user!' });
	}

	async confirmMute() {
		await this.btnMute.click();
		await this.waitForDismissal();
	}
}

export class MembersFlexTab extends FlexTab {
	readonly listbox: Listbox;

	readonly removeModal: ConfirmRemoveModal;

	readonly menu: MenuMore;

	readonly confirmMuteModal: ConfirmMuteModal;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Members' }));
		this.removeModal = new ConfirmRemoveModal(page.getByRole('dialog', { name: 'Confirmation', exact: true }));
		this.listbox = new Listbox(page);
		this.menu = new MenuMore(page);
		this.confirmMuteModal = new ConfirmMuteModal(page);
	}

	memberOption(username: string) {
		return this.root.locator('li', { hasText: username });
	}

	getMenuItemAction(action: string) {
		return this.listbox.getOption(action);
	}

	async openMemberInfo(username: string) {
		await this.memberOption(username).click();
	}

	async openMoreActions() {
		await this.root.getByRole('button', { name: 'More' }).click();
	}

	async openMemberOptionMoreActions(username: string) {
		await this.memberOption(username).hover();
		await this.memberOption(username).getByRole('button', { name: 'More' }).click();
	}

	async addUser(username: string) {
		await this.root.getByRole('button', { name: 'Add' }).click();
		await this.root.getByRole('textbox', { name: 'Choose users' }).pressSequentially(username);
		await this.root.getByRole('option', { name: username }).click();
		await this.root.getByRole('button', { name: 'Add users' }).click();
	}

	private get btnInviteLink() {
		return this.root.getByRole('button', { name: 'Invite Link' });
	}

	async inviteUser() {
		await this.btnInviteLink.click();
	}

	async muteUser(username: string) {
		await this.openMemberOptionMoreActions(username);
		await this.menu.selectMenuItem('Mute user');
		await this.confirmMuteModal.confirmMute();
	}

	async unmuteUser(username: string) {
		await this.openMemberOptionMoreActions(username);
		await this.menu.selectMenuItem('Unmute user');
	}

	async setUserAsModerator(username: string) {
		await this.openMemberOptionMoreActions(username);
		await this.menu.selectMenuItem('Set as moderator');
	}

	async setUserAsOwner(username: string) {
		await this.openMemberOptionMoreActions(username);
		await this.menu.selectMenuItem('Set as owner');
	}

	async showAllUsers() {
		await this.root.getByRole('button', { name: 'Online' }).click();
		await this.listbox.selectOption('All');
	}

	private async ignoreUserAction(action: string, username: string) {
		await this.openMemberInfo(username);
		await this.openMoreActions();
		await this.menu.selectMenuItem(action);
	}

	async ignoreUser(username: string) {
		await this.ignoreUserAction('Ignore', username);
	}

	async unignoreUser(username: string) {
		await this.ignoreUserAction('Unignore', username);
	}

	async confirmRemoveUser() {
		return this.removeModal.confirmRemove();
	}
}
