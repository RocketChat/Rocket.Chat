import type { Locator, Page } from '@playwright/test';

import { OmnichannelContactReviewModal } from './fragments';
import { OmnichannelManageContact } from './omnichannel-manage-contact';

export class OmnichannelContactInfo extends OmnichannelManageContact {
	readonly contactReviewModal: OmnichannelContactReviewModal;

	constructor(page: Page) {
		super(page);
		this.contactReviewModal = new OmnichannelContactReviewModal(page);
	}

	get dialogContactInfo(): Locator {
		return this.page.getByRole('dialog', { name: 'Contact' });
	}

	get btnEdit(): Locator {
		return this.page.locator('role=button[name="Edit"]');
	}

	get tabHistory(): Locator {
		return this.dialogContactInfo.getByRole('tab', { name: 'History' });
	}

	get historyItem(): Locator {
		return this.dialogContactInfo.getByRole('listitem').first();
	}

	get historyMessage(): Locator {
		return this.dialogContactInfo.getByRole('listitem').first();
	}

	get btnOpenChat(): Locator {
		return this.dialogContactInfo.getByRole('button', { name: 'Open chat' });
	}

	get btnSeeConflicts(): Locator {
		return this.dialogContactInfo.getByRole('button', { name: 'See conflicts' });
	}

	async solveConflict(field: string, value: string) {
		await this.btnSeeConflicts.click();
		await this.contactReviewModal.solveConfirmation(field, value);
	}
}
