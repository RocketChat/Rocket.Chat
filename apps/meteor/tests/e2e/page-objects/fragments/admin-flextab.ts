import type { Page } from '@playwright/test';

import { AdminFlextabUsers } from './admin-flextab-users';

export class AdminFlextab {
	readonly users: AdminFlextabUsers;

	constructor(page: Page) {
		this.users = new AdminFlextabUsers(page);
	}
}
