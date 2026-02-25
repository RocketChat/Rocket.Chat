import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Listbox } from '../listbox';
import { ConfirmDeleteRoomModal, ConfirmRemoveModal } from '../modals';
import { Modal } from '../modals/modal';

class AddExistingChannelModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Add Existing Channels' }));
	}

	get inputChannels(): Locator {
		return this.root.getByRole('textbox');
	}

	get btnAdd(): Locator {
		return this.root.getByRole('button', { name: 'Add' });
	}

	async confirmAdd() {
		await this.btnAdd.click();
		await this.waitForDismissal();
	}
}

export class ChannelsFlexTab extends FlexTab {
	readonly confirmRemoveModal: ConfirmRemoveModal;

	readonly confirmDeleteModal: ConfirmDeleteRoomModal;

	readonly addExistingChannelModal: AddExistingChannelModal;

	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Team Channels' }));
		this.confirmRemoveModal = new ConfirmRemoveModal(page.getByRole('dialog', { name: 'Are you sure?' }));
		this.confirmDeleteModal = new ConfirmDeleteRoomModal(page);
		this.addExistingChannelModal = new AddExistingChannelModal(page);
		this.listbox = new Listbox(page);
	}

	get btnAddExisting(): Locator {
		return this.root.getByRole('button', { name: 'Add Existing' });
	}

	get btnCreateNew(): Locator {
		return this.root.getByRole('button', { name: 'Create new' });
	}

	get channelsList(): Locator {
		return this.root.getByRole('list');
	}

	getListboxOption(name: string): Locator {
		return this.listbox.getOption(name);
	}

	channelOption(name: string) {
		return this.root.locator('li', { hasText: name });
	}

	async openChannelOptionMoreActions(name: string) {
		await this.channelOption(name).hover();
		await this.channelOption(name).getByRole('button', { name: 'More' }).click();
	}

	async confirmRemoveChannel() {
		return this.confirmRemoveModal.confirmRemove();
	}

	async confirmDeleteRoom() {
		return this.confirmDeleteModal.confirmDelete();
	}

	async addExistingChannel(name: string) {
		await this.btnAddExisting.click();
		await this.addExistingChannelModal.inputChannels.fill(name);
		await this.listbox.selectOption(name);
		await this.addExistingChannelModal.confirmAdd();
	}
}
