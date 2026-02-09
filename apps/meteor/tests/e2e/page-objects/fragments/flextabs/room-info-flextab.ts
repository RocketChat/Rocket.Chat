import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { MenuMore } from '../menu';
import { ConfirmDeleteTeamModal } from '../modals';
import { Modal } from '../modals/modal';

class ConfirmLeaveRoomModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Confirmation', exact: true }));
	}

	private get btnLeave() {
		return this.root.getByRole('button', { name: 'Leave', exact: true });
	}

	async confirmLeave() {
		await this.btnLeave.click();
		await this.waitForDismissal();
	}
}

class ConfirmDeleteRoomModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Delete' }));
	}

	private get btnDelete() {
		return this.root.getByRole('button', { name: 'Yes, delete', exact: true });
	}

	async confirmDelete() {
		await this.btnDelete.click();
		await this.waitForDismissal();
	}
}

export class RoomInfoFlexTab extends FlexTab {
	readonly menu: MenuMore;

	readonly confirmLeaveModal: ConfirmLeaveRoomModal;

	readonly confirmDeleteModal: ConfirmDeleteRoomModal;

	constructor(root: Locator, page: Page) {
		super(root);
		this.menu = new MenuMore(page);
		this.confirmLeaveModal = new ConfirmLeaveRoomModal(page);
		this.confirmDeleteModal = new ConfirmDeleteRoomModal(page);
	}

	get btnEdit(): Locator {
		return this.root.getByRole('button', { name: 'Edit' });
	}

	get btnLeave(): Locator {
		return this.root.getByRole('button', { name: 'Leave' });
	}

	get btnMore(): Locator {
		return this.root.getByRole('button', { name: 'More' });
	}

	get optionDelete(): Locator {
		return this.menu.getMenuItem('Delete');
	}

	async leaveRoom() {
		await this.btnLeave.click();
		await this.confirmLeaveModal.confirmLeave();
	}

	async deleteRoom() {
		await this.btnMore.click();
		await this.menu.selectMenuItem('Delete');
		await this.confirmDeleteModal.confirmDelete();
	}
}

class ConfirmConvertIntoChannelModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Confirmation', exact: true }));
	}

	private get btnConvert() {
		return this.root.getByRole('button', { name: 'Convert', exact: true });
	}

	async confirmConvert() {
		await this.btnConvert.click();
		await this.waitForDismissal();
	}
}

export class TeamInfoFlexTab extends RoomInfoFlexTab {
	readonly confirmDeleteTeamModal: ConfirmDeleteTeamModal;

	readonly confirmConvertIntoChannelModal: ConfirmConvertIntoChannelModal;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Team info' }), page);
		this.confirmDeleteTeamModal = new ConfirmDeleteTeamModal(page);
		this.confirmConvertIntoChannelModal = new ConfirmConvertIntoChannelModal(page);
	}

	async deleteTeam() {
		await this.btnMore.click();
		await this.menu.selectMenuItem('Delete');
		return this.confirmDeleteTeamModal.confirmDelete();
	}

	async convertIntoChannel() {
		await this.btnMore.click();
		await this.menu.selectMenuItem('Convert to Channel');
		await this.confirmConvertIntoChannelModal.confirmConvert();
	}
}

export class OmnichannelRoomInfoFlexTab extends RoomInfoFlexTab {
	getInfo(value: string): Locator {
		return this.root.locator(`span >> text="${value}"`);
	}

	getLabel(label: string): Locator {
		return this.root.locator(`div >> text="${label}"`);
	}

	getInfoByLabel(label: string): Locator {
		return this.root.getByLabel(label);
	}

	getTagInfoByLabel(label: string): Locator {
		return this.root.getByRole('list', { name: 'Tags' }).getByText(label, { exact: true });
	}
}
