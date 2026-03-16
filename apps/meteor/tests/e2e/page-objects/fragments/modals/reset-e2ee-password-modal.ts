import type { Page } from 'playwright-core';

import { Modal } from './modal';
import { LoginPage } from '../../login';

export class ResetE2EEPasswordModal extends Modal {
	private readonly login: LoginPage;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Reset E2EE password' }));
		this.login = new LoginPage(page);
	}

	private get resetE2EEPasswordButton() {
		return this.root.getByRole('button', { name: 'Reset E2EE password' });
	}

	async confirmReset() {
		await this.resetE2EEPasswordButton.click();
		await this.waitForDismissal();
		await this.login.waitForIt();
	}
}
