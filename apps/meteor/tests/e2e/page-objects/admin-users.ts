import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { MenuMoreActions, UserInfoFlexTab, EditUserFlexTab } from './fragments';

export class AdminUsers extends Admin {
	readonly editUser: EditUserFlexTab;

	readonly userInfo: UserInfoFlexTab;

	readonly userRowMenu: MenuMoreActions;

	constructor(page: Page) {
		super(page);
		this.editUser = new EditUserFlexTab(page);
		this.userInfo = new UserInfoFlexTab(page);
		this.userRowMenu = new MenuMoreActions(page);
	}

	get btnNewUser(): Locator {
		return this.page.locator('role=button[name="New user"]');
	}

	get btnInvite(): Locator {
		return this.page.locator('role=button[name="Invite"]');
	}

	get inputSearchUsers(): Locator {
		return this.page.getByRole('textbox', { name: 'Search Users' });
	}

	get btnMoreActionsMenu(): Locator {
		return this.page.getByRole('button', { name: 'More actions' });
	}

	get menuItemDeactivated(): Locator {
		return this.page.getByRole('menuitem', { name: 'Deactivate' });
	}

	get menuItemActivate(): Locator {
		return this.page.getByRole('menuitem', { name: 'Activate' });
	}

	private get menuItemMakeAdmin(): Locator {
		return this.userRowMenu.root.getByRole('menuitem', { name: 'Make Admin' });
	}

	private get menuItemRemoveAdmin(): Locator {
		return this.page.getByRole('menuitem', { name: 'Remove Admin' });
	}

	getUserRowByUsername(username: string): Locator {
		return this.page.locator('tr', { hasText: username });
	}

	getTabByName(name: 'All' | 'Pending' | 'Active' | 'Deactivated' = 'All'): Locator {
		return this.page.getByRole('tab', { name });
	}

	private async openUserActionMenu(username: string): Promise<void> {
		await this.getUserRowByUsername(username).getByRole('button', { name: 'More actions' }).click();
	}

	async makeUserAdmin(username: string) {
		await this.openUserActionMenu(username);
		await this.menuItemMakeAdmin.click();
	}

	async removeUserAdmin(username: string) {
		await this.openUserActionMenu(username);
		await this.menuItemRemoveAdmin.click();
	}

	async deleteUser(username: string): Promise<void> {
		await this.inputSearchUsers.fill(username);
		await this.getUserRowByUsername(username).click();
		await this.userInfo.btnMoreActions.click();
		await this.userInfo.menuItemDeleteUser.click();
	}
}
