import type { Locator, Page } from '@playwright/test';

import { Modal } from './modals/modal';

export class ABACConfirmationModal extends Modal {
	constructor(page: Page, title: string) {
		super(page.getByRole('dialog').filter({ hasText: title }));
	}

	get dialog(): Locator {
		return this.root;
	}
}

export class ABACMembershipPreview {
	readonly root: Locator;

	readonly updateRoomModal: ABACConfirmationModal;

	readonly selfLockoutModal: ABACConfirmationModal;

	constructor(page: Page) {
		this.root = page.getByRole('dialog', { name: 'Members (preview)' });
		this.updateRoomModal = new ABACConfirmationModal(page, 'Update ABAC room');
		this.selfLockoutModal = new ABACConfirmationModal(page, 'Are you sure?');
	}

	get losesAccess(): Locator {
		return this.root.getByRole('list', { name: 'Loses access' });
	}

	private get btnSave(): Locator {
		return this.root.getByRole('button', { name: 'Save', exact: true });
	}

	waitForDisplay() {
		return this.root.waitFor({ state: 'visible' });
	}

	async save() {
		await this.btnSave.click();
	}
}
