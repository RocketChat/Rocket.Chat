import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Modal } from '../modals/modal';

class ConfirmPruneMessageModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Are you sure?' }));
	}

	async pruneConfirm(): Promise<void> {
		await this.root.getByRole('button', { name: 'Yes, prune them!' }).click();
		await this.waitForDismissal();
	}
}

export class PruneMessagesFlexTab extends FlexTab {
	readonly confirmPruneModal: ConfirmPruneMessageModal;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Prune Messages' }));
		this.confirmPruneModal = new ConfirmPruneMessageModal(page);
	}

	get labelDoNotPrunePinned(): Locator {
		return this.root.locator('label', { hasText: 'Do not prune pinned messages' });
	}

	get labelFilesOnly(): Locator {
		return this.root.locator('label', { hasText: 'Only remove the attached files, keep messages' });
	}

	async prune(): Promise<void> {
		await this.root.getByRole('button', { name: 'Prune' }).click();
		await this.confirmPruneModal.pruneConfirm();
	}
}
