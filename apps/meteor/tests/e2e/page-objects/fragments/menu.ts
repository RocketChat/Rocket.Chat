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

	getMenuItem(itemName: string) {
		return this.root.getByRole('menuitem', { name: itemName, exact: true });
	}

	selectMenuItem(itemName: string) {
		return this.getMenuItem(itemName).click();
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

export class MenuOptions extends Menu {
	constructor(page: Page) {
		super(page.getByRole('menu', { name: 'Options' }));
	}
}
