import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Modal } from '../modals/modal';

class ConfirmPruneMessageModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Bulk delete' }).filter({ hasText: 'This cannot be undone' }));
	}

	async pruneConfirm(): Promise<void> {
		await this.root.getByRole('button', { name: /^Delete (messages and files|files)$/ }).click();
		await this.waitForDismissal();
	}
}

export class PruneMessagesFlexTab extends FlexTab {
	readonly confirmPruneModal: ConfirmPruneMessageModal;

	constructor(private page: Page) {
		super(page.getByRole('dialog', { name: 'Bulk delete' }).filter({ hasText: 'Only delete if sent by' }));
		this.confirmPruneModal = new ConfirmPruneMessageModal(page);
	}

	get checkboxDeletePinned(): Locator {
		return this.root.locator('label', { has: this.page.getByRole('checkbox', { name: 'Delete pinned messages and files', exact: true }) });
	}

	get checkboxDeleteDiscussion(): Locator {
		return this.root.locator('label', {
			has: this.page.getByRole('checkbox', { name: 'Delete discussion messages and files', exact: true }),
		});
	}

	get checkboxDeleteDiscussionOrigin(): Locator {
		return this.root.locator('label', {
			has: this.page.getByRole('checkbox', { name: 'Delete original discussion messages', exact: true }),
		});
	}

	get selectContent(): Locator {
		return this.root.getByRole('combobox', { name: 'Delete', exact: true });
	}

	async selectContentOption(name: 'Messages and files' | 'Only files'): Promise<void> {
		await this.selectContent.click();
		await this.page.getByRole('option', { name, exact: true }).click();
	}

	async prune(): Promise<void> {
		await this.root.getByRole('button', { name: /^Delete (messages and files|files)$/ }).click();
		await this.confirmPruneModal.pruneConfirm();
	}
}
