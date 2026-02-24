import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class PruneMessagesFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Prune Messages' }));
	}

	get doNotPrunePinned(): Locator {
		return this.root.getByRole('checkbox', { name: 'Do not prune pinned messages', exact: true });
	}

	get filesOnly(): Locator {
		return this.root.getByRole('checkbox', { name: 'Only remove the attached files, keep messages', exact: true });
	}

	async prune(): Promise<void> {
		await this.root.getByRole('button', { name: 'Prune' }).click();
		return this.root
			.getByRole('dialog', { name: 'Are you sure?', exact: true })
			.getByRole('button', { name: 'Yes, prune them!', exact: true })
			.click();
	}
}
