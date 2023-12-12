import type { Locator, Page } from '@playwright/test';

export class OmnichannelTransferChatModal {
	private readonly page: Page;

	private readonly dialog: Locator;

	constructor(page: Page) {
		this.page = page;
		this.dialog = page.locator('[data-qa-id="forward-chat-modal"]');
	}

	get inputComment(): Locator {
		return this.dialog.locator('textarea[name="comment"]');
	}

	get inputFowardDepartment(): Locator {
		return this.dialog.locator('[data-qa-id="forward-to-department"] input');
	}

	get inputFowardUser(): Locator {
		return this.dialog.locator('[data-qa="autocomplete-agent"] input');
	}

	get btnForward(): Locator {
		return this.dialog.locator('role=button[name="Forward"]');
	}

	get btnCancel(): Locator {
		return this.dialog.locator('role=button[name="Cancel"]');
	}

	async selectDepartment(name: string) {
		await this.inputFowardDepartment.click();
		await this.inputFowardDepartment.fill(name);
		await this.page.locator(`li[role="option"][title="${name}"]`).click();
	}

	async selectUser(name: string, id?: string) {
		await this.inputFowardUser.click();
		await this.inputFowardUser.fill(name);
		await this.page.locator(`li[role="option"][value="${id || name}"]`).click();
	}
}
