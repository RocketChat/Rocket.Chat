import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class VideoconfCallsFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Calls', exact: true }));
	}

	get content() {
		return this.root;
	}

	get btnJoinCall(): Locator {
		return this.root.getByRole('button', { name: 'Join call', exact: true });
	}
}
