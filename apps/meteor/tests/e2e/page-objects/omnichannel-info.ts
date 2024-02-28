import type { Locator } from '@playwright/test';

import { OmnichannelManageContact } from './omnichannel-manage-contact';

export class OmnichannelContactInfo extends OmnichannelManageContact {
	get btnEdit(): Locator {
		return this.page.locator('role=button[name="Edit"]');
	}

	get btnCall(): Locator {
		return this.page.locator('role=button[name=Call"]');
	}
}
