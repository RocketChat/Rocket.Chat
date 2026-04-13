import type { Locator, Page } from '@playwright/test';

export class HomeFlextabPruneMessages {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	private get form(): Locator {
		return this.page.getByRole('dialog', { name: 'Prune Messages' });
	}

	get doNotPrunePinned(): Locator {
		return this.form.locator('label', { hasText: 'Do not prune pinned messages' });
	}

	get filesOnly(): Locator {
		return this.form.locator('label', { hasText: 'Only remove the attached files, keep messages' });
	}

	async prune(): Promise<void> {
		await this.form.getByRole('button', { name: 'Prune' }).click();
		return this.page
			.getByRole('dialog', { name: 'Are you sure?', exact: true })
			.getByRole('button', { name: 'Yes, prune them!', exact: true })
			.click();
	}
}
