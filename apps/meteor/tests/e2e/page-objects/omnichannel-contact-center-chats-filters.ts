import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './fragments/flextab';

export class OmnichannelChatsFilters extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Filters' }));
	}

	get inputFrom(): Locator {
		return this.root.locator('input[name="from"]');
	}

	get inputTo(): Locator {
		return this.root.locator('input[name="to"]');
	}

	get btnApply(): Locator {
		return this.root.locator('role=button[name="Apply"]');
	}
}
