import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class OmnichannelResetPrioritiesModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Reset priorities' }));
	}

	private get btnResetConfirm() {
		return this.root.getByRole('button', { name: 'Reset' });
	}

	async reset() {
		await this.btnResetConfirm.click();
		await this.waitForDismissal();
	}
}
