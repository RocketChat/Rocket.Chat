import type { Locator } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';

export class AdminPermissions extends Admin {
	protected readonly route = AdminSectionsHref.permissions;

	protected readonly title = 'Permissions';

	get btnCreateRole(): Locator {
		return this.page.locator('button[name="New role"]');
	}

	openRoleByName(name: string): Locator {
		return this.page.getByRole('table').getByRole('button', { name });
	}

	get btnUsersInRole(): Locator {
		return this.page.getByRole('dialog').getByRole('button', { name: 'Users in role', exact: true });
	}

	get tableUsersInRole(): Locator {
		return this.page.getByRole('table');
	}

	get inputRoom(): Locator {
		return this.page.locator('input[placeholder="Room"]');
	}

	get inputUsers(): Locator {
		return this.page.locator('input[placeholder="Users"]');
	}

	getUserInRoleRowByUsername(username: string): Locator {
		return this.tableUsersInRole.locator('tr', { hasText: username });
	}

	removeUserFromRoleByUsername = async (username: string): Promise<void> => {
		await this.getUserInRoleRowByUsername(username).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	};
}
