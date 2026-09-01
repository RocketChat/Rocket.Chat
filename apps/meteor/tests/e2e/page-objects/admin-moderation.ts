import type { Locator } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';

export class AdminModeration extends Admin {
	protected readonly route = AdminSectionsHref.moderation;

	protected readonly title = 'Moderation';

	get tabReportedMessages(): Locator {
		return this.page.getByRole('tab', { name: 'Reported messages' });
	}

	get tabReportedUsers(): Locator {
		return this.page.getByRole('tab', { name: 'Reported users' });
	}

	async gotoMessages(): Promise<void> {
		await this.navigateTo(`${AdminSectionsHref.moderation}/messages`, this.tabReportedMessages);
	}

	async gotoUsers(): Promise<void> {
		await this.navigateTo(`${AdminSectionsHref.moderation}/users`, this.tabReportedUsers);
	}
}
