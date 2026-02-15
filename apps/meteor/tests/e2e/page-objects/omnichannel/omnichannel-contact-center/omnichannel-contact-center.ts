import type { Locator } from '@playwright/test';

import { OmnichannelAdmin } from '../omnichannel-admin';

export abstract class OmnichannelContactCenter extends OmnichannelAdmin {
	get tabContacts(): Locator {
		return this.page.getByRole('tab', { name: 'Contacts' });
	}

	get tabChats(): Locator {
		return this.page.getByRole('tab', { name: 'Chats' });
	}
}
