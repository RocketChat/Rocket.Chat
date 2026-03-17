import type { Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { MenuMore } from './menu';
import { ConfirmDeleteModal } from './modals';

export class FilesFlexTab extends FlexTab {
	readonly menu: MenuMore;

	readonly confirmDeleteModal: ConfirmDeleteModal;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Files' }));
		this.menu = new MenuMore(page);
		this.confirmDeleteModal = new ConfirmDeleteModal(page.getByRole('dialog', { name: 'Are you sure?' }));
	}

	get fileList() {
		return this.root.getByRole('list', { name: 'Files list' });
	}

	getFileByName(name: string) {
		return this.fileList.getByRole('listitem').filter({ hasText: name });
	}

	async deleteFile(name: string) {
		await this.getFileByName(name).getByRole('button', { name: 'More' }).click();
		await this.menu.selectMenuItem('Delete');
		await this.confirmDeleteModal.confirmDelete();
	}
}
