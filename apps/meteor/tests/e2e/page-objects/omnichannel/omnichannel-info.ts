import type { Locator, Page } from '@playwright/test';

import { FlexTab } from '../fragments/flextab';
import { OmnichannelContactReviewModal } from '../fragments/modals';

export class OmnichannelContactInfo extends FlexTab {
	readonly contactReviewModal: OmnichannelContactReviewModal;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Contact' }));
		this.contactReviewModal = new OmnichannelContactReviewModal(page);
	}

	get btnEdit(): Locator {
		return this.root.locator('role=button[name="Edit"]');
	}

	get tabHistory(): Locator {
		return this.root.getByRole('tab', { name: 'History' });
	}

	get historyItem(): Locator {
		return this.root.getByRole('listitem').first();
	}

	get historyMessage(): Locator {
		return this.root.getByRole('listitem').first();
	}

	get btnOpenChat(): Locator {
		return this.root.getByRole('button', { name: 'Open chat' });
	}

	get btnSeeConflicts(): Locator {
		return this.root.getByRole('button', { name: 'See conflicts' });
	}

	async solveConflict(field: string, value: string) {
		await this.btnSeeConflicts.click();
		await this.contactReviewModal.solveConfirmation(field, value);
	}
}
