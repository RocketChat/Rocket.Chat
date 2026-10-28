import type { Page } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';

export class AdminInfo extends Admin {
	constructor(page: Page) {
		super(page);
	}

	protected readonly route = AdminSectionsHref.workspace;

	protected readonly title = 'Workspace';

	/** Opens the workspace info page in the embedded layout. */
	async gotoEmbedded(): Promise<void> {
		await this.navigateTo(`${AdminSectionsHref.workspace}?layout=embedded`);
	}
}
