import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { MenuMore } from '../menu';

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

	get username(): Locator {
		return this.root.getByLabel('Username');
	}

	phoneLink(phoneNumber: string): Locator {
		return this.root.locator(`a[href="tel:${phoneNumber}"]`);
	}

	phoneLinkWithLabel(phoneNumber: string, label: string): Locator {
		return this.root.locator(`a[href="tel:${phoneNumber}"]`, { hasText: label });
	}

	get phoneLinks(): Locator {
		return this.root.locator('a[href^="tel:"]');
	}

	async openMoreActions() {
		await this.btnMoreActions.click();
	}
}
