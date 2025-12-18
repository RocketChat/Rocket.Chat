import type { Locator, Page } from '@playwright/test';

import { Modal } from './modal';

export class OmnichannelTransferChatModal extends Modal {
	private readonly page: Page;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Forward chat' }));
		this.page = page;
	}

	get inputComment(): Locator {
		return this.root.locator('textarea[name="comment"]');
	}

	get inputForwardDepartment(): Locator {
		return this.root.locator('[data-qa-id="forward-to-department"] input');
	}

	get inputForwardUser(): Locator {
		return this.root.locator('[data-qa="autocomplete-agent"] input');
	}

	get btnForward(): Locator {
		return this.root.locator('role=button[name="Forward"]');
	}

	async selectDepartment(name: string) {
		await this.inputForwardDepartment.click();
		await this.inputForwardDepartment.fill(name);
		await this.page.locator(`li[role="option"]`, { hasText: name }).click();
	}

	async selectUser(name: string, id?: string) {
		await this.inputForwardUser.click();
		await this.inputForwardUser.fill(name);
		await this.page.locator(`li[role="option"][value="${id || name}"]`).click();
	}
}
