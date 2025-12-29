import type { Locator, Page } from 'playwright-core';

import { Modal } from './modal';

export class AppsModal extends Modal {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Modal Example' }));
	}

	get textInput(): Locator {
		return this.root.locator('[name="modal_input"]');
	}

	get textInputErrorMessage(): Locator {
		return this.root.getByText('Validation failed');
	}

	get btnSubmit(): Locator {
		return this.root.getByRole('button', { name: 'Submit' });
	}

	async submit(inputText: string) {
		await this.textInput.fill(inputText);
		await this.btnSubmit.click();
		await this.waitForDismissal();
	}
}
