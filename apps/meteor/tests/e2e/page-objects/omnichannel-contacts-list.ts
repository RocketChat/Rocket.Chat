import type { Locator, Page } from '@playwright/test';

import { OmnichannelContactInfo } from './omnichannel-info';
import { OmnichannelManageContact } from './omnichannel-manage-contact';

export class OmnichannelContacts {
	private readonly page: Page;

	readonly newContact: OmnichannelManageContact;

	readonly contactInfo: OmnichannelContactInfo;

	constructor(page: Page) {
		this.page = page;
		this.newContact = new OmnichannelManageContact(page);
		this.contactInfo = new OmnichannelContactInfo(page);
	}

	get btnNewContact(): Locator {
		return this.page.locator('button >> text="New contact"');
	}

	get inputSearch(): Locator {
		return this.page.locator('input[placeholder="Search"]');
	}

	findRowByName(contactName: string) {
		return this.page.locator(`td >> text="${contactName}"`);
	}

	get toastSuccess(): Locator {
		return this.page.locator('.rcx-toastbar.rcx-toastbar--success');
	}
}
