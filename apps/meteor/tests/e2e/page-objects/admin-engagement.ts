import type { Locator } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';

export class AdminEngagement extends Admin {
	protected readonly route = AdminSectionsHref.engagement;

	protected readonly title = 'Engagement';

	get upsellModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Engagement dashboard' });
	}
}
