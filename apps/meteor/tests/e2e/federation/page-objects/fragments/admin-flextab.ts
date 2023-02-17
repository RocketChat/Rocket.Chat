import type { Page } from '@playwright/test';

import { FederationAdminFlextabUsers } from './admin-flextab-users';

export class FederationAdminFlextab {
	readonly users: FederationAdminFlextabUsers;

	constructor(page: Page) {
		this.users = new FederationAdminFlextabUsers(page);
	}
}
