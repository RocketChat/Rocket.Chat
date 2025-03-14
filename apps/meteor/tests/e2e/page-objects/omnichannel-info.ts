import type { Locator } from '@playwright/test';

import { OmnichannelManageContact } from './omnichannel-manage-contact';

export class OmnichannelContactInfo extends OmnichannelManageContact {
	get dialogContactInfo(): Locator {
		return this.page.getByRole('dialog', { name: 'Contact' });
	}

	get btnEdit(): Locator {
		return this.page.locator('role=button[name="Edit"]');
	}

	get btnCall(): Locator {
		return this.page.locator('role=button[name=Call"]');
	}

	get tabHistory(): Locator {
		return this.dialogContactInfo.getByRole('tab', { name: 'History' });
	}

	get historyItem(): Locator {
		return this.dialogContactInfo.getByRole('listitem').first();
	}

	get historyMessage(): Locator {
		return this.dialogContactInfo.getByRole('listitem').first();
	}

	get btnOpenChat(): Locator {
		return this.dialogContactInfo.getByRole('button', { name: 'Open chat' });
	}
}
