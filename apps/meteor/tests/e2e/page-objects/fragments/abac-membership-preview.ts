import type { Locator, Page } from '@playwright/test';

import { ABACSelfLockoutModal, ABACUpdateRoomModal } from './modals';

export class ABACMembershipPreview {
	readonly root: Locator;

	readonly updateRoomModal: ABACUpdateRoomModal;

	readonly selfLockoutModal: ABACSelfLockoutModal;

	constructor(page: Page) {
		this.root = page.getByRole('dialog', { name: 'Members (preview)' });
		this.updateRoomModal = new ABACUpdateRoomModal(page);
		this.selfLockoutModal = new ABACSelfLockoutModal(page);
	}

	get listLosesAccess(): Locator {
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
