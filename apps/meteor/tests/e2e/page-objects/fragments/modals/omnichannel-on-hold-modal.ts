import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';

export class OmnichannelOnHoldModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Place chat On-Hold' }));
	}

	private get btnPlaceChatOnHold(): Locator {
		return this.root.getByRole('button', { name: 'Place chat On-Hold' });
	}

	async confirm(): Promise<void> {
		await this.btnPlaceChatOnHold.click();
		await this.waitForDismissal();
	}
}
