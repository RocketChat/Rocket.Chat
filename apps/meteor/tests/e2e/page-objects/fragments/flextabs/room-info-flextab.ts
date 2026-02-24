import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Listbox } from '../listbox';
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
	readonly listbox: Listbox;

	readonly confirmLeaveModal: ConfirmLeaveRoomModal;

	readonly confirmDeleteModal: ConfirmDeleteRoomModal;

	constructor(root: Locator, page: Page) {
		super(root);
		this.listbox = new Listbox(page);
		this.confirmLeaveModal = new ConfirmLeaveRoomModal(page);
		this.confirmDeleteModal = new ConfirmDeleteRoomModal(page);
	}

	get btnEdit(): Locator {
		return this.root.getByRole('button', { name: 'Edit' });
	}

	get btnLeave(): Locator {
		return this.root.locator('role=button[name="Leave"]');
	}

	get btnMore(): Locator {
		return this.root.locator('role=button[name="More"]');
	}

	get optionDelete(): Locator {
		return this.listbox.getOption('Delete');
	}

	getMoreOption(option: string) {
		return this.root.locator(`role=menuitem[name="${option}"]`);
	}

	async leaveRoom() {
		await this.btnLeave.click();
		await this.confirmLeaveModal.confirmLeave();
	}

	async deleteRoom() {
		await this.btnMore.click();
		await this.optionDelete.click();
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

	constructor(locator: Locator, page: Page) {
		super(locator, page);
		this.confirmDeleteTeamModal = new ConfirmDeleteTeamModal(page);
		this.confirmConvertIntoChannelModal = new ConfirmConvertIntoChannelModal(page);
	}

	// get optionDelete(): Locator {
	// 	return this.listbox.getOption('Delete team');
	// }

	async deleteTeam() {
		await this.btnMore.click();
		await this.getMoreOption('Delete').click();
		return this.confirmDeleteTeamModal.confirmDelete();
	}

	async convertIntoChannel() {
		await this.btnMore.click();
		await this.getMoreOption('Convert to Channel').click();
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
