import type { Locator, Page } from '@playwright/test';

import { OmnichannelContactInfo } from '../omnichannel-info';
import { OmnichannelContactCenter } from './omnichannel-contact-center';
import { OmnichannelEditContactFlexTab } from '../../fragments/edit-contact-flaxtab';
import { Table } from '../../fragments/table';

class OmnichannelContactCenterContactsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Omnichannel Contact Center Contacts' }));
	}
}

export class OmnichannelContactCenterContacts extends OmnichannelContactCenter {
	readonly contactInfo: OmnichannelContactInfo;

	readonly editContact: OmnichannelEditContactFlexTab;

	readonly table: OmnichannelContactCenterContactsTable;

	constructor(page: Page) {
		super(page);
		this.contactInfo = new OmnichannelContactInfo(page);
		this.editContact = new OmnichannelEditContactFlexTab(page);
		this.table = new OmnichannelContactCenterContactsTable(page);
	}

	get btnNewContact(): Locator {
		return this.page.locator('button >> text="New contact"');
	}

	findRowMenu(contactName: string): Locator {
		return this.table.findRowByName(contactName).getByRole('button', { name: 'More Actions' });
	}

	findMenuItem(name: string): Locator {
		return this.page.getByRole('menuitem', { name });
	}

	get deleteContactModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Delete Contact' });
	}

	get inputDeleteContactConfirmation(): Locator {
		return this.deleteContactModal.getByRole('textbox', { name: 'Confirm contact removal' });
	}

	get btnDeleteContact(): Locator {
		return this.deleteContactModal.getByRole('button', { name: 'Delete' });
	}

	get inputStatus(): Locator {
		return this.page.locator('[data-qa="current-chats-status"]');
	}
}
