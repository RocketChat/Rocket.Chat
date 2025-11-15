import type { Locator, Page } from '@playwright/test';

import { Admin } from './admin';
import { MenuMoreActions, UserInfoFlexTab, EditUserFlexTab } from './fragments';
import { expect } from '../utils/test';

type UserActions = 'Make Admin' | 'Remove Admin' | 'Activate' | 'Deactivate';

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
		return this.page.getByRole('button', { name: 'New user', exact: true });
	}

	get btnInvite(): Locator {
		return this.page.getByRole('button', { name: 'Invite', exact: true });
	}

	private get inputSearchUsers(): Locator {
		return this.page.getByRole('textbox', { name: 'Search Users' });
	}

	get btnMoreActionsMenu(): Locator {
		return this.page.getByRole('button', { name: 'More actions' });
	}

	getUserRowByUsername(username: string): Locator {
		return this.page.locator('tr', { hasText: username }).first();
	}

	getTabByName(name: 'All' | 'Pending' | 'Active' | 'Deactivated' = 'All'): Locator {
		return this.page.getByRole('tab', { name });
	}

	private async openUserActionMenu(username: string): Promise<void> {
		await this.getUserRowByUsername(username).getByRole('button', { name: 'More actions' }).click();
	}

	async dispatchUserAction(username: string, action: UserActions) {
		await this.openUserActionMenu(username);
		await this.userRowMenu.root.getByRole('menuitem', { name: action }).click();
	}

	async deleteUser(username: string): Promise<void> {
		await this.searchUser(username);
		await this.getUserRowByUsername(username).click();
		await this.userInfo.btnMoreActions.click();
		await this.userInfo.menuItemDeleteUser.click();
	}

	async searchUser(username: string): Promise<void> {
		await this.inputSearchUsers.fill(username);
		await expect(this.getUserRowByUsername(username)).toHaveCount(1);
	}
}
