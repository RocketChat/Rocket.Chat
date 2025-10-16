import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class UpsellVoiceCallsModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Team voice calls' }));
	}

	get upsellModal() {
		return this.root;
	}

	private get closeButton() {
		return this.root.getByRole('button', { name: 'Close' });
	}

	async close() {
		await this.closeButton.click();
		await this.waitForDismissal();
	}
}
