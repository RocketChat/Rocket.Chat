import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { MenuMore } from '../menu';

export class UserInfoFlexTab extends FlexTab {
	readonly menu: MenuMore;

	constructor(page: Page) {
		// The room contextual bar is titled "Full profile" since the user
		// information redesign; admin still titles the same fragment "User Info".
		super(page.getByRole('dialog', { name: /^(Full profile|User Info)$/ }));
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

	get username(): Locator {
		return this.root.getByLabel('Username');
	}

	async openMoreActions() {
		await this.btnMoreActions.click();
	}
}
