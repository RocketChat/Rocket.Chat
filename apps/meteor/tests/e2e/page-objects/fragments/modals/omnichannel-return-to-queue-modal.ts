import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class OmnichannelReturnToQueueModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Return back to the Queue' }));
	}

	private get btnReturnToQueueConfirm() {
		return this.root.getByRole('button', { name: 'Confirm' });
	}

	async confirm() {
		await this.btnReturnToQueueConfirm.click();
		await this.waitForDismissal();
	}
}
