import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { MenuMore } from './menu';

export class UserInfoFlexTab extends FlexTab {
	readonly menu: MenuMore;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'User Info' }));
		this.menu = new MenuMore(page);
	}

	get btnEdit(): Locator {
		return this.root.getByRole('button', { name: 'Edit' });
	}

	get btnMoreActions(): Locator {
		return this.root.getByRole('button', { name: 'More' });
	}

	get menuItemDeleteUser(): Locator {
		return this.menu.root.getByRole('menuitem', { name: 'Delete' });
	}
}
