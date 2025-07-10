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
		return this.form.getByRole('checkbox', { name: 'Do not prune pinned messages', exact: true });
	}

	get filesOnly(): Locator {
		return this.form.getByRole('checkbox', { name: 'Only remove the attached files, keep messages', exact: true });
	}

	async prune(): Promise<void> {
		await this.form.getByRole('button', { name: 'Prune' }).click();
		return this.page
			.getByRole('dialog', { name: 'Are you sure?', exact: true })
			.getByRole('button', { name: 'Yes, prune them!', exact: true })
			.click();
	}
}
