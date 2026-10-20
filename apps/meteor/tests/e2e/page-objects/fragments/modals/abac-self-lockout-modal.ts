import type { Page } from '@playwright/test';

import { Modal } from './modal';

export class ABACSelfLockoutModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog').filter({ hasText: 'Are you sure?' }));
	}

	getText(text: string) {
		return this.root.getByText(text);
	}
}
