import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export abstract class Menu {
	constructor(public root: Locator) {}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}
}

export class MenuMore extends Menu {
	constructor(page: Page) {
		super(page.getByRole('menu', { name: 'More' }));
	}
}

export class MenuMoreActions extends Menu {
	constructor(page: Page) {
		super(page.getByRole('menu', { name: 'More actions' }));
	}
}
