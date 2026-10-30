import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';

export class PasskeyDetailsFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Passkey details' }));
	}

	get btnRename(): Locator {
		return this.root.getByRole('button', { name: 'Rename passkey', exact: true });
	}

	get btnRemove(): Locator {
		return this.root.getByRole('button', { name: 'Remove passkey', exact: true });
	}
}
